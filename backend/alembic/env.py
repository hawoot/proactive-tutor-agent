"""Alembic environment - wired to the app's models and DATABASE_URL.
render_as_batch makes ALTER TABLE work on SQLite too."""
import sys
from pathlib import Path
from alembic import context
from sqlalchemy import engine_from_config, pool

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app import config as app_config  # noqa: E402
from app.models import Base  # noqa: E402

alembic_config = context.config
if not alembic_config.get_main_option("sqlalchemy.url"):
    alembic_config.set_main_option("sqlalchemy.url", app_config.DATABASE_URL)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=alembic_config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        alembic_config.get_section(alembic_config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
