"""Students register with real email + phone (stored in DB). Login accepts registration ID, email, or mobile (normalized digits)."""

INTERNAL_EMAIL_SUFFIX = "@student.quizplatform.internal"


def student_internal_email(registration_id: str) -> str:
    rid = registration_id.strip().upper().replace(" ", "")
    return f"student.{rid}{INTERNAL_EMAIL_SUFFIX}"


def is_student_internal_email(email: str | None) -> bool:
    return bool(email and email.endswith(INTERNAL_EMAIL_SUFFIX))


def normalize_registration_id(registration_id: str) -> str:
    return registration_id.strip().upper().replace(" ", "")


def normalize_mobile_digits(mobile: str | None) -> str | None:
    """Digits only for login lookup / indexing (handles +91, spaces, dashes)."""
    if not mobile:
        return None
    d = "".join(c for c in str(mobile).strip() if c.isdigit())
    if not d:
        return None
    # Prefer last 10 digits for Indian numbers when longer (e.g. 91XXXXXXXXXX)
    if len(d) > 10:
        d = d[-10:]
    return d if len(d) >= 8 else None
