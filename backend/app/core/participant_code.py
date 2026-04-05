"""Unique short codes for competition check-in (alongside college registration ID)."""
import secrets

# Readable at event desks: no 0/O, 1/I/L confusion
_SAFE = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"


def generate_participant_code() -> str:
    return "".join(secrets.choice(_SAFE) for _ in range(8))


def assign_unique_participant_code(db, max_tries: int = 40) -> str:
    from app.models.user import User

    for _ in range(max_tries):
        code = generate_participant_code()
        if not db.query(User).filter(User.participant_code == code).first():
            return code
    raise RuntimeError("Could not allocate participant_code")
