from sqlalchemy.orm import Session
from app.models.user import User
from app.models.gamification import Badge, StudentBadge
from app.models.attempt import QuizAttempt


XP_PER_CORRECT = 10
XP_BONUS_PERFECT = 50
XP_BONUS_FAST = 20

LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000]

BADGES = [
    {"name": "First Step", "icon": "🎯", "description": "Complete your first quiz", "condition_type": "quiz_count", "condition_value": 1},
    {"name": "Quiz Warrior", "icon": "⚔️", "description": "Complete 10 quizzes", "condition_type": "quiz_count", "condition_value": 10},
    {"name": "Quiz Master", "icon": "🏆", "description": "Complete 50 quizzes", "condition_type": "quiz_count", "condition_value": 50},
    {"name": "Perfect Score", "icon": "💯", "description": "Score 100% on any quiz", "condition_type": "perfect_score", "condition_value": 100},
    {"name": "High Achiever", "icon": "⭐", "description": "Score above 90%", "condition_type": "high_score", "condition_value": 90},
    {"name": "Speed Demon", "icon": "⚡", "description": "Complete a quiz in record time", "condition_type": "speed", "condition_value": 0},
    {"name": "Century Club", "icon": "💎", "description": "Earn 1000 XP", "condition_type": "xp", "condition_value": 1000},
]


class GamificationService:

    def award_xp(self, student: User, correct_count: int, percentage: float, db: Session) -> int:
        xp = correct_count * XP_PER_CORRECT
        if percentage == 100:
            xp += XP_BONUS_PERFECT
        elif percentage >= 90:
            xp += 20
        elif percentage >= 75:
            xp += 10

        student.xp_points += xp
        student.level = self._calculate_level(student.xp_points)
        db.commit()
        return xp

    def _calculate_level(self, xp: int) -> int:
        for level, threshold in enumerate(LEVEL_THRESHOLDS):
            if xp < threshold:
                return max(1, level)
        return len(LEVEL_THRESHOLDS)

    def check_and_award_badges(self, student: User, db: Session):
        # Seed badges if not present
        for badge_def in BADGES:
            existing = db.query(Badge).filter(Badge.name == badge_def["name"]).first()
            if not existing:
                badge = Badge(**badge_def, xp_required=0)
                db.add(badge)
        db.flush()

        existing_badge_ids = {sb.badge_id for sb in db.query(StudentBadge).filter(StudentBadge.student_id == student.id).all()}
        quiz_count = db.query(QuizAttempt).filter(QuizAttempt.student_id == student.id, QuizAttempt.status == "submitted").count()
        attempts = db.query(QuizAttempt).filter(QuizAttempt.student_id == student.id, QuizAttempt.status == "submitted").all()
        max_percentage = max((a.percentage or 0) for a in attempts) if attempts else 0

        for badge_def in BADGES:
            badge = db.query(Badge).filter(Badge.name == badge_def["name"]).first()
            if not badge or badge.id in existing_badge_ids:
                continue

            earned = False
            ct = badge_def["condition_type"]
            cv = badge_def["condition_value"]

            if ct == "quiz_count" and quiz_count >= cv:
                earned = True
            elif ct == "perfect_score" and max_percentage >= 100:
                earned = True
            elif ct == "high_score" and max_percentage >= cv:
                earned = True
            elif ct == "xp" and student.xp_points >= cv:
                earned = True

            if earned:
                sb = StudentBadge(student_id=student.id, badge_id=badge.id)
                db.add(sb)

        db.commit()

    def get_student_badges(self, student_id: int, db: Session) -> list:
        student_badges = db.query(StudentBadge).filter(StudentBadge.student_id == student_id).all()
        result = []
        for sb in student_badges:
            badge = db.query(Badge).filter(Badge.id == sb.badge_id).first()
            if badge:
                result.append({
                    "badge_id": badge.id,
                    "name": badge.name,
                    "icon": badge.icon,
                    "description": badge.description,
                    "earned_at": sb.earned_at,
                })
        return result
