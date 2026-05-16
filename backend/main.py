from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import jwt
import csv
import io

from database import SessionLocal, engine, Base
import models, schemas, crud

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Goal Tracking Portal", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "goalportal-secret-key-2025"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = crud.get_user_by_username(db, username=username)
    if user is None:
        raise credentials_exception
    return user

def require_role(*roles):
    def checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return checker

# ── Auth ──────────────────────────────────────────────────────────────────────
@app.post("/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    token = create_access_token({"sub": user.username}, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": token, "token_type": "bearer", "role": user.role, "user_id": user.id, "full_name": user.full_name}

@app.get("/me", response_model=schemas.UserOut)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# ── Users ─────────────────────────────────────────────────────────────────────
@app.get("/users", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db), _=Depends(require_role("admin", "manager"))):
    return crud.get_all_users(db)

@app.get("/employees", response_model=list[schemas.UserOut])
def list_employees(db: Session = Depends(get_db), _=Depends(require_role("admin", "manager"))):
    return crud.get_users_by_role(db, "employee")

# ── Goals ─────────────────────────────────────────────────────────────────────
@app.post("/goals", response_model=schemas.GoalOut)
def create_goal(goal: schemas.GoalCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_role("employee"))):
    existing = crud.get_goals_by_user(db, current_user.id)
    if len([g for g in existing if g.status != "deleted"]) >= 8:
        raise HTTPException(status_code=400, detail="Maximum 8 goals allowed")
    if goal.weightage < 10:
        raise HTTPException(status_code=400, detail="Each goal weightage must be at least 10%")
    return crud.create_goal(db, goal, current_user.id)

@app.get("/goals/my", response_model=list[schemas.GoalOut])
def my_goals(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_goals_by_user(db, current_user.id)

@app.get("/goals/employee/{employee_id}", response_model=list[schemas.GoalOut])
def employee_goals(employee_id: int, db: Session = Depends(get_db), _=Depends(require_role("manager", "admin"))):
    return crud.get_goals_by_user(db, employee_id)

@app.get("/goals/pending", response_model=list[schemas.GoalOut])
def pending_goals(db: Session = Depends(get_db), _=Depends(require_role("manager", "admin"))):
    return crud.get_goals_by_status(db, "submitted")

@app.get("/goals/all", response_model=list[schemas.GoalOut])
def all_goals(db: Session = Depends(get_db), _=Depends(require_role("manager", "admin"))):
    return crud.get_all_goals(db)

@app.put("/goals/{goal_id}", response_model=schemas.GoalOut)
def update_goal(goal_id: int, goal: schemas.GoalUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_goal = crud.get_goal(db, goal_id)
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if current_user.role == "employee":
        if db_goal.employee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your goal")
        if db_goal.status == "approved":
            raise HTTPException(status_code=400, detail="Approved goals are locked")
        if goal.weightage and goal.weightage < 10:
            raise HTTPException(status_code=400, detail="Weightage must be at least 10%")
    return crud.update_goal(db, goal_id, goal)

@app.delete("/goals/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_role("employee"))):
    db_goal = crud.get_goal(db, goal_id)
    if not db_goal or db_goal.employee_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    if db_goal.status in ("submitted", "approved"):
        raise HTTPException(status_code=400, detail="Cannot delete submitted/approved goal")
    crud.delete_goal(db, goal_id)
    return {"detail": "Deleted"}

@app.post("/goals/submit")
def submit_goals(db: Session = Depends(get_db), current_user: models.User = Depends(require_role("employee"))):
    goals = crud.get_goals_by_user(db, current_user.id)
    draft_goals = [g for g in goals if g.status == "draft"]
    if not draft_goals:
        raise HTTPException(status_code=400, detail="No draft goals to submit")
    total_weight = sum(g.weightage for g in draft_goals)
    if abs(total_weight - 100) > 0.01:
        raise HTTPException(status_code=400, detail=f"Total weightage must equal 100% (currently {total_weight}%)")
    for g in draft_goals:
        crud.update_goal_status(db, g.id, "submitted")
    return {"detail": f"{len(draft_goals)} goals submitted for review"}

@app.post("/goals/{goal_id}/approve")
def approve_goal(goal_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_role("manager", "admin"))):
    db_goal = crud.get_goal(db, goal_id)
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    crud.update_goal_status(db, goal_id, "approved", reviewed_by=current_user.id)
    return {"detail": "Goal approved"}

@app.post("/goals/{goal_id}/reject")
def reject_goal(goal_id: int, reason: schemas.RejectReason, db: Session = Depends(get_db), current_user: models.User = Depends(require_role("manager", "admin"))):
    db_goal = crud.get_goal(db, goal_id)
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    crud.update_goal_status(db, goal_id, "rejected", reviewed_by=current_user.id, rejection_reason=reason.reason)
    return {"detail": "Goal rejected"}

@app.post("/goals/{goal_id}/unlock")
def unlock_goal(goal_id: int, db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    db_goal = crud.get_goal(db, goal_id)
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    crud.update_goal_status(db, goal_id, "draft")
    return {"detail": "Goal unlocked to draft"}

@app.put("/goals/{goal_id}/manager-edit", response_model=schemas.GoalOut)
def manager_edit_goal(goal_id: int, edit: schemas.ManagerEdit, db: Session = Depends(get_db), _=Depends(require_role("manager", "admin"))):
    db_goal = crud.get_goal(db, goal_id)
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return crud.manager_edit_goal(db, goal_id, edit)

# ── Quarterly Updates ─────────────────────────────────────────────────────────
@app.post("/updates", response_model=schemas.UpdateOut)
def create_update(update: schemas.UpdateCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_role("employee"))):
    db_goal = crud.get_goal(db, update.goal_id)
    if not db_goal or db_goal.employee_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    if db_goal.status != "approved":
        raise HTTPException(status_code=400, detail="Can only update approved goals")
    return crud.create_update(db, update, current_user.id)

@app.get("/updates/goal/{goal_id}", response_model=list[schemas.UpdateOut])
def get_updates(goal_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return crud.get_updates_by_goal(db, goal_id)

@app.post("/updates/{update_id}/checkin")
def add_checkin(update_id: int, checkin: schemas.CheckinCreate, db: Session = Depends(get_db), current_user: models.User = Depends(require_role("manager", "admin"))):
    return crud.add_checkin(db, update_id, checkin.comment, current_user.id)

@app.get("/updates/employee/{employee_id}", response_model=list[schemas.UpdateOut])
def get_employee_updates(employee_id: int, db: Session = Depends(get_db), _=Depends(require_role("manager", "admin"))):
    return crud.get_updates_by_employee(db, employee_id)

# ── Reports ───────────────────────────────────────────────────────────────────
@app.get("/reports/export")
def export_csv(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    goals = crud.get_all_goals(db)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Employee", "Goal Title", "Description", "Target", "UoM", "Weightage", "Status", "Q1", "Q2", "Q3", "Q4", "Reviewed By"])
    for g in goals:
        updates = crud.get_updates_by_goal(db, g.id)
        q = {u.quarter: u.achievement for u in updates}
        writer.writerow([
            g.employee.full_name if g.employee else "",
            g.title, g.description, g.target, g.uom, g.weightage, g.status,
            q.get("Q1",""), q.get("Q2",""), q.get("Q3",""), q.get("Q4",""),
            g.reviewer.full_name if g.reviewer else ""
        ])
    output.seek(0)
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=goals_report.csv"})

@app.get("/stats/overview")
def stats_overview(db: Session = Depends(get_db), _=Depends(require_role("admin", "manager"))):
    return crud.get_overview_stats(db)

# ── Seed ──────────────────────────────────────────────────────────────────────
@app.post("/seed")
def seed_data(db: Session = Depends(get_db)):
    from seed import seed_database
    seed_database(db)
    return {"detail": "Database seeded successfully"}
