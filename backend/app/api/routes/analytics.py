from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Callable, Optional
from app.db.database import get_db
from app.models.user import User
from app.models.quiz import Quiz
from app.models.question import Question
from app.models.attempt import QuizAttempt, AttemptAnswer
from app.models.platform_settings import PlatformSettings
from app.core.dependencies import get_teacher, get_student

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/student/me")
def student_analytics(db: Session = Depends(get_db), student: User = Depends(get_student)):
    ps = db.query(PlatformSettings).filter(PlatformSettings.id == 1).first()
    if ps is not None and not ps.student_analytics_enabled:
        raise HTTPException(
            status_code=403,
            detail="Student analytics are disabled by the administrator.",
        )
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.student_id == student.id,
        QuizAttempt.status == "submitted",
    ).all()

    if not attempts:
        return {
            "total_attempts": 0,
            "average_percentage": 0,
            "best_percentage": 0,
            "total_xp": student.xp_points,
            "level": student.level,
            "performance_trend": [],
            "topic_analysis": [],
            "accuracy": 0,
        }

    percentages = [a.percentage or 0 for a in attempts]
    avg_pct = round(sum(percentages) / len(percentages), 2)
    best_pct = round(max(percentages), 2)
    total_correct = sum(a.correct_count or 0 for a in attempts)
    total_answered = sum((a.correct_count or 0) + (a.wrong_count or 0) for a in attempts)
    accuracy = round((total_correct / total_answered * 100) if total_answered else 0, 2)

    # Topic analysis
    topic_stats = {}
    for attempt in attempts:
        answers = db.query(AttemptAnswer).filter(AttemptAnswer.attempt_id == attempt.id).all()
        for ans in answers:
            q = db.query(Question).filter(Question.id == ans.question_id).first()
            if q and q.topic:
                t = q.topic
                if t not in topic_stats:
                    topic_stats[t] = {"correct": 0, "total": 0}
                topic_stats[t]["total"] += 1
                if ans.is_correct:
                    topic_stats[t]["correct"] += 1

    topic_analysis = [
        {
            "topic": t,
            "accuracy": round(v["correct"] / v["total"] * 100, 2),
            "total_questions": v["total"],
            "correct": v["correct"],
            "status": "Strong" if v["correct"] / v["total"] >= 0.7 else "Weak",
        }
        for t, v in topic_stats.items() if v["total"] > 0
    ]

    # Performance trend (last 10 attempts)
    sorted_attempts = sorted(attempts, key=lambda a: a.submitted_at or a.started_at)[-10:]
    trend = [
        {
            "attempt_id": a.id,
            "quiz_id": a.quiz_id,
            "percentage": a.percentage,
            "date": str((a.submitted_at or a.started_at).date()),
        }
        for a in sorted_attempts
    ]

    return {
        "total_attempts": len(attempts),
        "average_percentage": avg_pct,
        "best_percentage": best_pct,
        "total_xp": student.xp_points,
        "level": student.level,
        "accuracy": accuracy,
        "performance_trend": trend,
        "topic_analysis": topic_analysis,
        "strong_topics": [t for t in topic_analysis if t["status"].startswith("Strong")],
        "weak_topics": [t for t in topic_analysis if t["status"].startswith("Weak")],
    }


@router.get("/teacher/quiz/{quiz_id}")
def quiz_analytics(quiz_id: int, db: Session = Depends(get_db), teacher: User = Depends(get_teacher)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        return {"error": "Quiz not found"}

    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.status == "submitted",
    ).all()

    if not attempts:
        return {"quiz_id": quiz_id, "total_attempts": 0}

    percentages = [a.percentage or 0 for a in attempts]
    avg_pct = round(sum(percentages) / len(percentages), 2)

    # Score distribution bins
    bins = {"0-40": 0, "41-60": 0, "61-75": 0, "76-90": 0, "91-100": 0}
    for p in percentages:
        if p <= 40:
            bins["0-40"] += 1
        elif p <= 60:
            bins["41-60"] += 1
        elif p <= 75:
            bins["61-75"] += 1
        elif p <= 90:
            bins["76-90"] += 1
        else:
            bins["91-100"] += 1

    # Per-question analysis
    questions = db.query(Question).filter(Question.quiz_id == quiz_id).all()
    question_stats = []
    pie_correct = 0
    pie_wrong = 0
    for q in questions:
        answers = db.query(AttemptAnswer).filter(AttemptAnswer.question_id == q.id).all()
        total = len(answers)
        correct = sum(1 for a in answers if a.is_correct)
        pie_correct += correct
        pie_wrong += total - correct
        question_stats.append({
            "question_id": q.id,
            "question_text": q.text[:80] + "..." if len(q.text) > 80 else q.text,
            "topic": q.topic,
            "success_rate": round(correct / total * 100, 2) if total else 0,
            "total_attempts": total,
            "correct": correct,
        })

    # Student leaderboard for this quiz
    leaderboard = sorted(attempts, key=lambda a: (a.percentage or 0), reverse=True)[:10]
    leaderboard_data = []
    for rank, a in enumerate(leaderboard, 1):
        s = db.query(User).filter(User.id == a.student_id).first()
        leaderboard_data.append({
            "rank": rank,
            "student_name": s.full_name if s else "Unknown",
            "registration_id": s.registration_id if s else None,
            "stream": s.stream if s else None,
            "college_area": s.college_area if s else None,
            "percentage": a.percentage,
            "score": a.score,
            "time_taken_seconds": a.time_taken_seconds,
        })

    return {
        "quiz_id": quiz_id,
        "quiz_title": quiz.title,
        "total_attempts": len(attempts),
        "average_percentage": avg_pct,
        "highest_score": max(percentages),
        "lowest_score": min(percentages),
        "pass_rate": round(sum(1 for p in percentages if p >= quiz.pass_percentage) / len(percentages) * 100, 2),
        "score_distribution": bins,
        "answer_outcomes": {"correct": pie_correct, "incorrect": pie_wrong},
        "question_stats": sorted(question_stats, key=lambda x: x["success_rate"]),
        "leaderboard": leaderboard_data,
    }


def _norm_label(val) -> str:
    s = (val or "").strip()
    return s if s else "Unknown"


def _clamp_rank_tier(v: object, default: int = 10) -> int:
    try:
        x = int(v)
        return max(1, min(500, x))
    except (TypeError, ValueError):
        return default


def _rank_cutoffs_from_db(db: Session) -> List[int]:
    row = db.query(PlatformSettings).filter(PlatformSettings.id == 1).first()
    if row is None:
        return [3, 10, 20]
    t1 = _clamp_rank_tier(getattr(row, "analytics_rank_tier_1", None), 3)
    t2 = _clamp_rank_tier(getattr(row, "analytics_rank_tier_2", None), 10)
    t3 = _clamp_rank_tier(getattr(row, "analytics_rank_tier_3", None), 20)
    return sorted({t1, t2, t3})


def _student_entry(sid: int, pct: float, u: Optional[User], scores_by_student: dict) -> dict:
    return {
        "full_name": u.full_name if u else "Unknown",
        "registration_id": u.registration_id if u else None,
        "participant_code": u.participant_code if u else None,
        "stream": u.stream if u else None,
        "college_area": u.college_area if u else None,
        "state_region": u.state_region if u else None,
        "institution_name": u.institution_name if u else None,
        "competition_category": u.competition_category if u else None,
        "avg_percentage": pct,
        "attempts": len(scores_by_student.get(sid, [])),
    }


def _top_slices_for_group(
    sids: set,
    cutoffs: List[int],
    student_avg: dict,
    sid_user: dict,
    scores_by_student: dict,
) -> dict:
    ranked = sorted(
        [(sid, student_avg[sid]) for sid in sids if sid in student_avg],
        key=lambda x: -x[1],
    )
    out = {}
    for n in cutoffs:
        out[str(n)] = [
            _student_entry(sid, pct, sid_user.get(sid), scores_by_student)
            for sid, pct in ranked[:n]
        ]
    return out


def _accumulate_buckets(attempts, sid_user: dict, key_fn: Callable):
    buckets_pcts: dict = defaultdict(list)
    buckets_sids: dict = defaultdict(set)
    for a in attempts:
        u = sid_user.get(a.student_id)
        key = _norm_label(key_fn(u))
        buckets_pcts[key].append(a.percentage or 0)
        buckets_sids[key].add(a.student_id)
    return buckets_pcts, buckets_sids


def _cohort_rows(
    label_key: str,
    buckets_pcts: dict,
    buckets_sids: dict,
    cutoffs: List[int],
    student_avg: dict,
    sid_user: dict,
    scores_by_student: dict,
) -> List[dict]:
    rows = []
    for label in sorted(buckets_pcts.keys(), key=lambda k: (-len(buckets_pcts[k]), k)):
        pcts = buckets_pcts[label]
        sids = buckets_sids[label]
        rows.append(
            {
                label_key: label,
                "attempts": len(pcts),
                "unique_students": len(sids),
                "avg_percentage": round(sum(pcts) / len(pcts), 2) if pcts else 0,
                "top_by_cutoff": _top_slices_for_group(sids, cutoffs, student_avg, sid_user, scores_by_student),
            }
        )
    return rows


def _empty_insights(cutoffs: List[int], **extra):
    return {
        "has_data": False,
        "rank_cutoffs": cutoffs,
        "leaderboard_by_cutoff": {str(n): [] for n in cutoffs},
        "top_3_overall": [],
        "total_quizzes": 0,
        "total_attempts": 0,
        "unique_students": 0,
        "by_stream": [],
        "by_college_area": [],
        "by_state_region": [],
        "by_institution": [],
        "by_competition_category": [],
        "top_students": [],
        "by_question_difficulty": [],
        "score_band_distribution": {"0-40": 0, "41-60": 0, "61-75": 0, "76-90": 0, "91-100": 0},
        "answer_outcomes": {"correct": 0, "incorrect": 0},
        **extra,
    }


@router.get("/teacher/insights")
def teacher_cohort_insights(db: Session = Depends(get_db), teacher: User = Depends(get_teacher)):
    """
    PIET / multi-college quest analytics: stream, area, state, institution, category,
    and configurable rank tiers (admin: e.g. top 3 / 10 / 20 for round shortlisting).
    """
    cutoffs = _rank_cutoffs_from_db(db)
    quizzes = db.query(Quiz).filter(Quiz.teacher_id == teacher.id).all()
    quiz_ids = [q.id for q in quizzes]
    if not quiz_ids:
        return _empty_insights(cutoffs)

    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.quiz_id.in_(quiz_ids), QuizAttempt.status == "submitted")
        .all()
    )

    if not attempts:
        return _empty_insights(cutoffs, total_quizzes=len(quizzes))

    student_ids = list({a.student_id for a in attempts})
    students = db.query(User).filter(User.id.in_(student_ids)).all()
    sid_user = {u.id: u for u in students}

    scores_by_student: dict = defaultdict(list)
    for a in attempts:
        scores_by_student[a.student_id].append(a.percentage or 0)
    student_avg = {sid: round(sum(p) / len(p), 2) for sid, p in scores_by_student.items()}

    unique_students = len(student_ids)

    sp, ss = _accumulate_buckets(attempts, sid_user, lambda u: u.stream if u else None)
    by_stream = _cohort_rows("stream", sp, ss, cutoffs, student_avg, sid_user, scores_by_student)

    ap, as_ = _accumulate_buckets(attempts, sid_user, lambda u: u.college_area if u else None)
    by_college_area = _cohort_rows("college_area", ap, as_, cutoffs, student_avg, sid_user, scores_by_student)

    stp, sts = _accumulate_buckets(attempts, sid_user, lambda u: u.state_region if u else None)
    by_state_region = _cohort_rows("state_region", stp, sts, cutoffs, student_avg, sid_user, scores_by_student)

    ip, is_ = _accumulate_buckets(attempts, sid_user, lambda u: u.institution_name if u else None)
    by_institution = _cohort_rows("institution_name", ip, is_, cutoffs, student_avg, sid_user, scores_by_student)

    cp, cs = _accumulate_buckets(attempts, sid_user, lambda u: u.competition_category if u else None)
    by_competition_category = _cohort_rows("competition_category", cp, cs, cutoffs, student_avg, sid_user, scores_by_student)

    ranked_all = sorted(student_avg.items(), key=lambda x: -x[1])
    leaderboard_by_cutoff = {
        str(n): [_student_entry(sid, pct, sid_user.get(sid), scores_by_student) for sid, pct in ranked_all[:n]]
        for n in cutoffs
    }
    top_students = leaderboard_by_cutoff[str(max(cutoffs))] if cutoffs else []
    top_3_overall = leaderboard_by_cutoff[str(min(cutoffs))][:3] if cutoffs and leaderboard_by_cutoff.get(str(min(cutoffs))) else []

    qa_rows = (
        db.query(AttemptAnswer, Question)
        .join(Question, AttemptAnswer.question_id == Question.id)
        .filter(Question.quiz_id.in_(quiz_ids))
        .all()
    )
    diff_bucket = defaultdict(lambda: {"correct": 0, "total": 0})
    for ans, q in qa_rows:
        d = (q.difficulty or "medium").lower()
        if d not in ("easy", "medium", "hard"):
            d = "medium"
        diff_bucket[d]["total"] += 1
        if ans.is_correct:
            diff_bucket[d]["correct"] += 1

    order = ["easy", "medium", "hard"]
    by_question_difficulty = []
    for d in order:
        v = diff_bucket.get(d, {"correct": 0, "total": 0})
        tot = v["total"]
        by_question_difficulty.append(
            {
                "difficulty": d,
                "answers_count": tot,
                "success_rate": round(v["correct"] / tot * 100, 2) if tot else 0,
            }
        )

    score_band_distribution = {"0-40": 0, "41-60": 0, "61-75": 0, "76-90": 0, "91-100": 0}
    for a in attempts:
        p = a.percentage or 0
        if p <= 40:
            score_band_distribution["0-40"] += 1
        elif p <= 60:
            score_band_distribution["41-60"] += 1
        elif p <= 75:
            score_band_distribution["61-75"] += 1
        elif p <= 90:
            score_band_distribution["76-90"] += 1
        else:
            score_band_distribution["91-100"] += 1

    answer_outcomes = {"correct": 0, "incorrect": 0}
    for ans, _q in qa_rows:
        if ans.is_correct:
            answer_outcomes["correct"] += 1
        else:
            answer_outcomes["incorrect"] += 1

    return {
        "has_data": True,
        "quest_mode": True,
        "rank_cutoffs": cutoffs,
        "leaderboard_by_cutoff": leaderboard_by_cutoff,
        "total_quizzes": len(quizzes),
        "total_attempts": len(attempts),
        "unique_students": unique_students,
        "by_stream": by_stream,
        "by_college_area": by_college_area,
        "by_state_region": by_state_region,
        "by_institution": by_institution,
        "by_competition_category": by_competition_category,
        "top_students": top_students,
        "top_3_overall": top_3_overall,
        "by_question_difficulty": by_question_difficulty,
        "score_band_distribution": score_band_distribution,
        "answer_outcomes": answer_outcomes,
    }


@router.get("/teacher/overview")
def teacher_overview(db: Session = Depends(get_db), teacher: User = Depends(get_teacher)):
    quizzes = db.query(Quiz).filter(Quiz.teacher_id == teacher.id).all()
    quiz_ids = [q.id for q in quizzes]

    total_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.quiz_id.in_(quiz_ids),
        QuizAttempt.status == "submitted",
    ).count() if quiz_ids else 0

    return {
        "total_quizzes": len(quizzes),
        "published_quizzes": sum(1 for q in quizzes if q.is_published),
        "total_attempts": total_attempts,
        "quiz_summary": [
            {
                "quiz_id": q.id,
                "title": q.title,
                "is_published": q.is_published,
                "subject": q.subject,
            }
            for q in quizzes
        ],
    }
