"""Pick which question IDs belong to a quiz attempt (pool of many → subset per student)."""
from __future__ import annotations

import json
import random
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.attempt import QuizAttempt
from app.models.question import Question
from app.models.quiz import Quiz


def pick_question_ids_for_attempt(quiz: Quiz, db: Session) -> List[int]:
    """Select approved question IDs for this attempt (order = delivery order before shuffle in GET)."""
    all_q = (
        db.query(Question)
        .filter(Question.quiz_id == quiz.id, Question.is_approved == True)
        .order_by(Question.id)
        .all()
    )
    ids = [q.id for q in all_q]
    if not ids:
        return []

    mode = (quiz.question_pool_mode or "all").strip().lower()
    n_req = int(quiz.questions_per_attempt or 0)

    if mode == "all" or n_req <= 0 or n_req >= len(ids):
        return list(ids)
    if mode == "first_n":
        return ids[:n_req]
    if mode == "last_n":
        return ids[-n_req:]
    if mode == "random_n":
        return random.sample(ids, min(n_req, len(ids)))
    return list(ids)


def get_assigned_ids(attempt: QuizAttempt) -> Optional[List[int]]:
    if not attempt.assigned_question_ids:
        return None
    try:
        data = json.loads(attempt.assigned_question_ids)
        return [int(x) for x in data]
    except (json.JSONDecodeError, TypeError, ValueError):
        return None


def questions_for_attempt(quiz: Quiz, attempt: QuizAttempt, db: Session) -> List[Question]:
    ids = get_assigned_ids(attempt)
    if not ids:
        return (
            db.query(Question)
            .filter(Question.quiz_id == attempt.quiz_id, Question.is_approved == True)
            .order_by(Question.id)
            .all()
        )
    rows = db.query(Question).filter(Question.id.in_(ids)).all()
    order = {qid: i for i, qid in enumerate(ids)}
    rows.sort(key=lambda q: order.get(q.id, 10**9))
    return rows
