from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class StartAttemptResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    started_at: datetime
    duration_minutes: int
    total_questions: int


class SaveAnswerRequest(BaseModel):
    attempt_id: int
    question_id: int
    selected_option: Optional[str] = None  # None to clear
    time_taken_seconds: int = 0


class SubmitAttemptRequest(BaseModel):
    attempt_id: int


class AttemptResultOut(BaseModel):
    attempt_id: int
    quiz_id: int
    quiz_title: str
    student_id: int
    score: float
    total_marks: float
    percentage: float
    correct_count: int
    wrong_count: int
    unattempted_count: int
    time_taken_seconds: Optional[int]
    status: str
    submitted_at: Optional[datetime]
    answers: list
    passed: bool
    xp_earned: int
    performance_category: str

    class Config:
        from_attributes = True


class AntiCheatEventRequest(BaseModel):
    attempt_id: int
    event_type: str
    details: Optional[str] = None


class AIGenerateRequest(BaseModel):
    topic: str
    subject: Optional[str] = None
    difficulty: str = "medium"
    num_questions: int = 5
    quiz_id: Optional[int] = None


class AIExplainRequest(BaseModel):
    question_text: str
    correct_option: str
    correct_answer_text: str
    student_selected: str
    student_answer_text: str


class AIFromContentRequest(BaseModel):
    content: str  # extracted text from PDF or pasted text
    topic: Optional[str] = None
    difficulty: str = "medium"
    num_questions: int = 5
    quiz_id: Optional[int] = None
