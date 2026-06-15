"""Engine + session factory. Models live in app/models.py; schema changes are
managed by Alembic (backend/alembic/), applied automatically on startup."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from . import config

_is_sqlite = config.DATABASE_URL.startswith("sqlite")
engine = create_engine(
    config.DATABASE_URL, echo=False,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
)

if _is_sqlite:
    # WAL + busy timeout: safe concurrent access from multiple workers.
    # Foreign keys are off by default in SQLite - turn on.
    from sqlalchemy import event

    @event.listens_for(engine, "connect")
    def _sqlite_pragmas(dbapi_connection, _):
        cur = dbapi_connection.cursor()
        cur.execute("PRAGMA journal_mode=WAL")
        cur.execute("PRAGMA busy_timeout=5000")
        cur.execute("PRAGMA foreign_keys=ON")
        cur.close()

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def get_db():
    """FastAPI dependency - one session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations() -> None:
    """Bring the schema to the latest Alembic revision. Idempotent; called on
    startup so 'git pull && restart' is the whole upgrade procedure."""
    from alembic import command
    from alembic.config import Config as AlembicConfig

    cfg = AlembicConfig(str(config.BACKEND_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(config.BACKEND_DIR / "alembic"))
    cfg.set_main_option("sqlalchemy.url", config.DATABASE_URL)
    command.upgrade(cfg, "head")
