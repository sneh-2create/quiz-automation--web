import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SAEnum
from app.db.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    teacher = "teacher"
    student = "student"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    # Students: college-issued ID; login with registration ID, stored email, or normalized mobile.
    registration_id = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=False)
    father_name = Column(String, nullable=True)
    college_area = Column(String, nullable=True)
    # State / UT (PIET Quest–style multi-state cohorts)
    state_region = Column(String, nullable=True)
    # College / school display name (separate from area/city)
    institution_name = Column(String, nullable=True)
    stream = Column(String, nullable=True)
    # e.g. UG / PG / Diploma / School — competition bucket
    competition_category = Column(String, nullable=True)
    mobile_no = Column(String, nullable=True)
    # Normalized digits for fast login lookup (optional; set on register / profile update)
    mobile_digits = Column(String, nullable=True, index=True)
    # Short check-in code shown to student (in addition to registration_id)
    participant_code = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.student)
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=True)
    avatar_url = Column(String, nullable=True)

    # Gamification
    xp_points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak_days = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
