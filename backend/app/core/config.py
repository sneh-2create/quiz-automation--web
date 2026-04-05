from pydantic import model_validator
from pydantic_settings import BaseSettings
from typing import List
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    DATABASE_URL: str = f"sqlite:///{(BASE_DIR / 'quiz_platform.db').as_posix()}"
    # When true, demo admin/teacher/student accounts are not seeded (use for production / live events).
    DISABLE_DEMO_SEED: bool = False
    SECRET_KEY: str = "change-me-to-a-long-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    GEMINI_API_KEY: str = ""
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:5174"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    @model_validator(mode="after")
    def resolve_sqlite_path(self):
        """sqlite:///./quiz.db is cwd-dependent and breaks seed/login; anchor relative paths to backend/."""
        url = self.DATABASE_URL
        if not url.startswith("sqlite:///"):
            return self
        path_part = url[len("sqlite:///") :]
        p = Path(path_part)
        if p.is_absolute():
            return self
        resolved = (BASE_DIR / path_part).resolve()
        object.__setattr__(self, "DATABASE_URL", f"sqlite:///{resolved.as_posix()}")
        return self

    class Config:
        env_file = str(BASE_DIR / ".env")


settings = Settings()
