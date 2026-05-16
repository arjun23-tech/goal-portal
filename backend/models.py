from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # employee | manager | admin
    department = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    goals = relationship("Goal", foreign_keys="Goal.employee_id", back_populates="employee")
    reviewed_goals = relationship("Goal", foreign_keys="Goal.reviewed_by", back_populates="reviewer")
    updates = relationship("QuarterlyUpdate", foreign_keys="QuarterlyUpdate.employee_id", back_populates="employee")

class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, default="")
    target = Column(String, nullable=False)
    uom = Column(String, nullable=False)  # Unit of Measurement
    weightage = Column(Float, nullable=False)
    status = Column(String, default="draft")  # draft | submitted | approved | rejected
    rejection_reason = Column(Text, default="")
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("User", foreign_keys=[employee_id], back_populates="goals")
    reviewer = relationship("User", foreign_keys=[reviewed_by], back_populates="reviewed_goals")
    updates = relationship("QuarterlyUpdate", back_populates="goal")

class QuarterlyUpdate(Base):
    __tablename__ = "quarterly_updates"
    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    quarter = Column(String, nullable=False)  # Q1 | Q2 | Q3 | Q4
    achievement = Column(String, nullable=False)
    notes = Column(Text, default="")
    checkin_comment = Column(Text, default="")
    checkin_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    checkin_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    goal = relationship("Goal", back_populates="updates")
    employee = relationship("User", foreign_keys=[employee_id], back_populates="updates")
    checker = relationship("User", foreign_keys=[checkin_by])
