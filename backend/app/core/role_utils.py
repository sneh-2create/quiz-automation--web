"""Normalize user.role (SQLAlchemy Enum or str) to a plain string."""
from app.models.user import User


def role_str(user: User) -> str:
    r = user.role
    if r is None:
        return ""
    return r.value if hasattr(r, "value") else str(r)
