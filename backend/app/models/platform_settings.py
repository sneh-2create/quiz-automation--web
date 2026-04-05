from sqlalchemy import Column, Integer, Boolean

from app.db.database import Base


class PlatformSettings(Base):
    """Singleton row (id=1) for platform-wide toggles."""

    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, default=1)
    student_analytics_enabled = Column(Boolean, default=True, nullable=False)
    # When True, students may start a new attempt even after max_attempts (repeat completed quiz).
    allow_quiz_retakes = Column(Boolean, default=False, nullable=False)
    # Teacher analytics: how many ranks to show per cohort (e.g. 3, 10, 20 for rounds).
    analytics_rank_tier_1 = Column(Integer, default=3, nullable=False)
    analytics_rank_tier_2 = Column(Integer, default=10, nullable=False)
    analytics_rank_tier_3 = Column(Integer, default=20, nullable=False)
