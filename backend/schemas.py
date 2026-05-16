from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ── Auth ──────────────────────────────────────────────────────────────────────
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    full_name: str

class UserOut(BaseModel):
    id: int
    username: str
    full_name: str
    email: str
    role: str
    department: str
    created_at: datetime
    class Config:
        from_attributes = True

# ── Goals ─────────────────────────────────────────────────────────────────────
class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    target: str
    uom: str
    weightage: float

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target: Optional[str] = None
    uom: Optional[str] = None
    weightage: Optional[float] = None

class ManagerEdit(BaseModel):
    target: Optional[str] = None
    weightage: Optional[float] = None

class RejectReason(BaseModel):
    reason: str

class GoalOut(BaseModel):
    id: int
    employee_id: int
    title: str
    description: str
    target: str
    uom: str
    weightage: float
    status: str
    rejection_reason: str
    reviewed_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    employee: Optional[UserOut] = None
    reviewer: Optional[UserOut] = None
    class Config:
        from_attributes = True

# ── Quarterly Updates ─────────────────────────────────────────────────────────
class UpdateCreate(BaseModel):
    goal_id: int
    quarter: str
    achievement: str
    notes: Optional[str] = ""

class CheckinCreate(BaseModel):
    comment: str

class UpdateOut(BaseModel):
    id: int
    goal_id: int
    employee_id: int
    quarter: str
    achievement: str
    notes: str
    checkin_comment: str
    checkin_by: Optional[int] = None
    checkin_at: Optional[datetime] = None
    submitted_at: datetime
    goal: Optional[GoalOut] = None
    class Config:
        from_attributes = True
