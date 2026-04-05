from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.security import decode_token
from app.db.database import get_db
from app.models.user import User
from app.core.role_utils import role_str

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


def require_role(*roles: str):
    def _checker(current_user: User = Depends(get_current_user)):
        if role_str(current_user) not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(roles)}",
            )
        return current_user
    return _checker


def get_teacher(current_user: User = Depends(get_current_user)) -> User:
    if role_str(current_user) != "teacher":
        raise HTTPException(status_code=403, detail="Teacher access required")
    return current_user


def get_student(current_user: User = Depends(get_current_user)) -> User:
    if role_str(current_user) != "student":
        raise HTTPException(status_code=403, detail="Student access required")
    return current_user


def get_admin(current_user: User = Depends(get_current_user)) -> User:
    if role_str(current_user) != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def get_teacher_or_admin(current_user: User = Depends(get_current_user)) -> User:
    r = role_str(current_user)
    if r not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Teacher or admin access required")
    return current_user
