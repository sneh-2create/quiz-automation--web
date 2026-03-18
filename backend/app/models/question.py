import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Enum as SAEnum, ForeignKey, Text
from app.db.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=True)  # can be in bank without quiz
    text = Column(Text, nullable=False)
    option_a = Column(String, nullable=False)
    option_b = Column(String, nullable=False)
    option_c = Column(String, nullable=False)
    option_d = Column(String, nullable=False)
    correct_option = Column(String, nullable=False)  # "a", "b", "c", "d"
    explanation = Column(Text, nullable=True)
    difficulty = Column(String, default="medium")
    topic = Column(String, nullable=True)
    subject = Column(String, nullable=True)
    marks = Column(Float, default=1.0)
    is_ai_generated = Column(Boolean, default=False)
    is_approved = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
