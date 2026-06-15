"""attempt.mode: remember what KIND of question an attempt was

Revision ID: b5c6d7e8f9a0
Revises: a2b3c4d5e6f7
Create Date: 2026-06-15 10:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'b5c6d7e8f9a0'
down_revision = 'a2b3c4d5e6f7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('attempts', schema=None) as batch_op:
        batch_op.add_column(sa.Column('mode', sa.String(length=20), nullable=False,
                                      server_default='short_drill'))


def downgrade() -> None:
    with op.batch_alter_table('attempts', schema=None) as batch_op:
        batch_op.drop_column('mode')
