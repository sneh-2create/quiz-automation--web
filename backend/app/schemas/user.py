from pydantic import BaseModel, EmailStr, model_validator, field_validator
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    """Teachers: email + password. Students: real email + registration_id + phone + profile (live events)."""

    email: Optional[EmailStr] = None
    registration_id: Optional[str] = None
    full_name: str
    password: str
    role: str = "student"
    father_name: Optional[str] = None
    college_area: Optional[str] = None
    state_region: Optional[str] = None
    institution_name: Optional[str] = None
    competition_category: Optional[str] = None
    stream: Optional[str] = None
    mobile_no: Optional[str] = None

    @model_validator(mode="after")
    def validate_by_role(self):
        if self.role == "student":
            if not self.email or not str(self.email).strip():
                raise ValueError("Students must provide a real email address (stored securely for the event).")
            if not self.registration_id or not str(self.registration_id).strip():
                raise ValueError("registration_id is required for students")
            missing = []
            for name in ("father_name", "college_area", "stream", "mobile_no"):
                val = getattr(self, name)
                if val is None or not str(val).strip():
                    missing.append(name)
            if missing:
                raise ValueError(
                    "Students must provide father_name, college_area, stream, and mobile_no."
                )
        elif self.role == "teacher":
            if not self.email:
                raise ValueError("Teachers must provide an email address.")
        return self


class SignInRequest(BaseModel):
    """username = staff email or student registration ID / email / mobile. portal enforces student vs staff UI."""

    username: str
    password: str
    portal: Optional[str] = None  # "student" | "staff" (recommended for live events)


class UserOut(BaseModel):
    id: int
    email: Optional[str] = None
    registration_id: Optional[str] = None
    participant_code: Optional[str] = None
    full_name: str
    father_name: Optional[str] = None
    college_area: Optional[str] = None
    state_region: Optional[str] = None
    institution_name: Optional[str] = None
    competition_category: Optional[str] = None
    stream: Optional[str] = None
    mobile_no: Optional[str] = None
    role: str
    is_active: bool
    is_approved: bool
    xp_points: int
    level: int
    streak_days: int
    created_at: datetime

    @field_validator("role", mode="before")
    @classmethod
    def _role_to_str(cls, v):
        return v.value if hasattr(v, "value") else v

    @model_validator(mode="after")
    def _hide_internal_student_email(self):
        from app.core.student_identity import is_student_internal_email

        if self.email and is_student_internal_email(self.email):
            object.__setattr__(self, "email", None)
        return self

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    father_name: Optional[str] = None
    college_area: Optional[str] = None
    state_region: Optional[str] = None
    institution_name: Optional[str] = None
    competition_category: Optional[str] = None
    stream: Optional[str] = None
    mobile_no: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
