from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings


def _get_database_url() -> str:
    db_url = (settings.database_url or "").strip()
    if db_url:
        return db_url

    sqlite_path = Path(__file__).resolve().parent.parent / "travel_dashboard.db"
    return f"sqlite:///{sqlite_path.as_posix()}"


db_url = _get_database_url()
connect_args = {}
if db_url.lower().startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(db_url, connect_args=connect_args if connect_args else {})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
