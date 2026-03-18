from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.db.database import Base


class AntiCheatLog(Base):
    __tablename__ = "anticheat_logs"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("quiz_attempts.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_type = Column(String, nullable=False)  # "tab_switch", "fullscreen_exit", "copy_attempt"
    details = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    warning_count = Column(Integer, default=1)
