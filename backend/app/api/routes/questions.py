from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session
from typing import List, Optional
import io
import pandas as pd
from app.db.database import get_db
from app.models.question import Question
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.quiz import QuestionCreate, QuestionUpdate, QuestionOut
from app.core.dependencies import get_current_user, get_teacher, get_teacher_or_admin
from app.core.role_utils import role_str

router = APIRouter(prefix="/questions", tags=["Questions"])


def _normalize_question_text(t: str) -> str:
    return " ".join((t or "").strip().lower().split())


@router.post("/", response_model=QuestionOut)
def create_question(data: QuestionCreate, db: Session = Depends(get_db), user: User = Depends(get_teacher_or_admin)):
    payload = data.model_dump(exclude={"allow_duplicate"})
    allow_dup = data.allow_duplicate
    if not payload.get("quiz_id"):
        raise HTTPException(status_code=400, detail="quiz_id is required")
    quiz = db.query(Quiz).filter(Quiz.id == payload["quiz_id"]).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    r = role_str(user)
    if r == "teacher" and quiz.teacher_id != user.id:
        raise HTTPException(status_code=403, detail="Not your quiz")
    created_by_id = quiz.teacher_id

    if not allow_dup:
        nt = _normalize_question_text(payload["text"])
        existing = db.query(Question).filter(Question.quiz_id == payload["quiz_id"]).all()
        if any(_normalize_question_text(x.text) == nt for x in existing):
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "duplicate_question_same_quiz",
                    "message": "This quiz already contains the same question text. Retry with allow_duplicate: true if you want another copy.",
                },
            )

    q = Question(**payload, created_by=created_by_id, is_ai_generated=False)
    db.add(q)
    db.commit()
    db.refresh(q)
    return q


@router.get("/", response_model=List[QuestionOut])
def list_questions(
    quiz_id: Optional[int] = Query(None),
    bank_for_quiz_id: Optional[int] = Query(
        None,
        description="Questions from the same teacher, excluding this quiz (for re-use / question bank).",
    ),
    topic: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    subject: Optional[str] = Query(None),
    is_approved: Optional[bool] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Question)
    if bank_for_quiz_id is not None:
        bq = db.query(Quiz).filter(Quiz.id == bank_for_quiz_id).first()
        if not bq:
            raise HTTPException(status_code=404, detail="Quiz not found for bank")
        r = role_str(current_user)
        if r == "teacher" and bq.teacher_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your quiz")
        if r == "student":
            raise HTTPException(status_code=403, detail="Access denied")
        tid = bq.teacher_id
        q = q.filter(
            Question.created_by == tid,
            or_(Question.quiz_id != bank_for_quiz_id, Question.quiz_id.is_(None)),
        )
    if quiz_id:
        q = q.filter(Question.quiz_id == quiz_id)
    if topic:
        q = q.filter(Question.topic.ilike(f"%{topic}%"))
    if difficulty:
        q = q.filter(Question.difficulty == difficulty)
    if subject:
        q = q.filter(Question.subject.ilike(f"%{subject}%"))
    if is_approved is not None:
        q = q.filter(Question.is_approved == is_approved)
    return q.offset(skip).limit(limit).all()


@router.patch("/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: int,
    data: QuestionUpdate,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_teacher),
):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    for field, val in data.model_dump(exclude_none=True).items():
        setattr(question, field, val)
    if data.is_approved is not None:
        question.approved_by = teacher.id
    db.commit()
    db.refresh(question)
    return question


@router.delete("/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db), teacher: User = Depends(get_teacher)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(question)
    db.commit()
    return {"message": "Question deleted"}


@router.post("/bulk-import")
async def bulk_import_questions(
    quiz_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    teacher: User = Depends(get_teacher),
):
    """Import questions from Excel/CSV file.
    Expected columns: text, option_a, option_b, option_c, option_d, correct_option, difficulty, topic, subject, marks
    """
    contents = await file.read()
    try:
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {str(e)}")

    required_cols = {"text", "option_a", "option_b", "option_c", "option_d", "correct_option"}
    if not required_cols.issubset(set(df.columns)):
        raise HTTPException(status_code=400, detail=f"Missing columns. Required: {required_cols}")

    imported = 0
    errors = []
    for idx, row in df.iterrows():
        try:
            q = Question(
                quiz_id=quiz_id,
                text=str(row["text"]),
                option_a=str(row["option_a"]),
                option_b=str(row["option_b"]),
                option_c=str(row["option_c"]),
                option_d=str(row["option_d"]),
                correct_option=str(row["correct_option"]).lower().strip(),
                difficulty=str(row.get("difficulty", "medium")),
                topic=str(row.get("topic", "")) or None,
                subject=str(row.get("subject", "")) or None,
                marks=float(row.get("marks", 1.0)),
                created_by=teacher.id,
                is_ai_generated=False,
                is_approved=True,
            )
            db.add(q)
            imported += 1
        except Exception as e:
            errors.append(f"Row {idx + 2}: {str(e)}")

    db.commit()
    return {"imported": imported, "errors": errors}
