"""skill_states.note (per-skill memory) + users.focus_enrollment_id (focus toggle)

Revision ID: f1a2b3c4d5e6
Revises: c1a2b3d4e5f6
Create Date: 2026-06-14 12:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'f1a2b3c4d5e6'
down_revision = 'c1a2b3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('skill_states', schema=None) as batch_op:
        batch_op.add_column(sa.Column('note', sa.Text(), nullable=False, server_default=''))
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('focus_enrollment_id', sa.Integer(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('focus_enrollment_id')
    with op.batch_alter_table('skill_states', schema=None) as batch_op:
        batch_op.drop_column('note')
