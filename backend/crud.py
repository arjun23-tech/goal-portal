from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime
import models, schemas

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    pwd_context.hash("test")  # verify bcrypt works
except Exception:
    pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# ── Users ─────────────────────────────────────────────────────────────────────
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_all_users(db: Session):
    return db.query(models.User).all()

def get_users_by_role(db: Session, role: str):
    return db.query(models.User).filter(models.User.role == role).all()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def create_user(db: Session, username: str, full_name: str, email: str, password: str, role: str, department: str = ""):
    user = models.User(
        username=username,
        full_name=full_name,
        email=email,
        hashed_password=hash_password(password),
        role=role,
        department=department
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# ── Goals ─────────────────────────────────────────────────────────────────────
def get_goal(db: Session, goal_id: int):
    return db.query(models.Goal).filter(models.Goal.id == goal_id).first()

def get_goals_by_user(db: Session, user_id: int):
    return db.query(models.Goal).filter(models.Goal.employee_id == user_id).all()

def get_goals_by_status(db: Session, status: str):
    return db.query(models.Goal).filter(models.Goal.status == status).all()

def get_all_goals(db: Session):
    return db.query(models.Goal).all()

def create_goal(db: Session, goal: schemas.GoalCreate, employee_id: int):
    db_goal = models.Goal(
        employee_id=employee_id,
        title=goal.title,
        description=goal.description or "",
        target=goal.target,
        uom=goal.uom,
        weightage=goal.weightage,
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

def update_goal(db: Session, goal_id: int, goal: schemas.GoalUpdate):
    db_goal = get_goal(db, goal_id)
    if goal.title is not None:
        db_goal.title = goal.title
    if goal.description is not None:
        db_goal.description = goal.description
    if goal.target is not None:
        db_goal.target = goal.target
    if goal.uom is not None:
        db_goal.uom = goal.uom
    if goal.weightage is not None:
        db_goal.weightage = goal.weightage
    db_goal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_goal)
    return db_goal

def manager_edit_goal(db: Session, goal_id: int, edit: schemas.ManagerEdit):
    db_goal = get_goal(db, goal_id)
    if edit.target is not None:
        db_goal.target = edit.target
    if edit.weightage is not None:
        db_goal.weightage = edit.weightage
    db_goal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_goal)
    return db_goal

def update_goal_status(db: Session, goal_id: int, status: str, reviewed_by: int = None, rejection_reason: str = ""):
    db_goal = get_goal(db, goal_id)
    db_goal.status = status
    if reviewed_by:
        db_goal.reviewed_by = reviewed_by
    if rejection_reason:
        db_goal.rejection_reason = rejection_reason
    db_goal.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_goal)
    return db_goal

def delete_goal(db: Session, goal_id: int):
    db_goal = get_goal(db, goal_id)
    db.delete(db_goal)
    db.commit()

# ── Quarterly Updates ─────────────────────────────────────────────────────────
def get_updates_by_goal(db: Session, goal_id: int):
    return db.query(models.QuarterlyUpdate).filter(models.QuarterlyUpdate.goal_id == goal_id).all()

def get_updates_by_employee(db: Session, employee_id: int):
    return db.query(models.QuarterlyUpdate).filter(models.QuarterlyUpdate.employee_id == employee_id).all()

def create_update(db: Session, update: schemas.UpdateCreate, employee_id: int):
    # Delete existing update for same quarter if exists
    existing = db.query(models.QuarterlyUpdate).filter(
        models.QuarterlyUpdate.goal_id == update.goal_id,
        models.QuarterlyUpdate.quarter == update.quarter
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
    db_update = models.QuarterlyUpdate(
        goal_id=update.goal_id,
        employee_id=employee_id,
        quarter=update.quarter,
        achievement=update.achievement,
        notes=update.notes or "",
    )
    db.add(db_update)
    db.commit()
    db.refresh(db_update)
    return db_update

def add_checkin(db: Session, update_id: int, comment: str, manager_id: int):
    db_update = db.query(models.QuarterlyUpdate).filter(models.QuarterlyUpdate.id == update_id).first()
    if not db_update:
        return None
    db_update.checkin_comment = comment
    db_update.checkin_by = manager_id
    db_update.checkin_at = datetime.utcnow()
    db.commit()
    db.refresh(db_update)
    return db_update

# ── Stats ─────────────────────────────────────────────────────────────────────
def get_overview_stats(db: Session):
    goals = db.query(models.Goal).all()
    employees = db.query(models.User).filter(models.User.role == "employee").all()
    updates = db.query(models.QuarterlyUpdate).all()
    return {
        "total_employees": len(employees),
        "total_goals": len(goals),
        "draft": sum(1 for g in goals if g.status == "draft"),
        "submitted": sum(1 for g in goals if g.status == "submitted"),
        "approved": sum(1 for g in goals if g.status == "approved"),
        "rejected": sum(1 for g in goals if g.status == "rejected"),
        "total_updates": len(updates),
    }
