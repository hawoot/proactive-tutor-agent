"""modes redesign: skill.kind (replaces effort+question_type),
question.mode + question.style, drop enrollment.selection_strategy

Revision ID: a2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-06-14 15:05:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'a2b3c4d5e6f7'
down_revision = 'f1a2b3c4d5e6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('skills', schema=None) as batch_op:
        batch_op.add_column(sa.Column('kind', sa.String(length=20), nullable=False, server_default='concept'))
        batch_op.drop_column('question_type')
        batch_op.drop_column('effort')
    with op.batch_alter_table('questions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('mode', sa.String(length=20), nullable=False, server_default='short_drill'))
        batch_op.add_column(sa.Column('style', sa.String(length=24), nullable=False, server_default=''))
    with op.batch_alter_table('enrollments', schema=None) as batch_op:
        batch_op.drop_column('selection_strategy')


def downgrade() -> None:
    with op.batch_alter_table('enrollments', schema=None) as batch_op:
        batch_op.add_column(sa.Column('selection_strategy', sa.String(length=40),
                                      nullable=False, server_default='due_then_weakest'))
    with op.batch_alter_table('questions', schema=None) as batch_op:
        batch_op.drop_column('style')
        batch_op.drop_column('mode')
    with op.batch_alter_table('skills', schema=None) as batch_op:
        batch_op.add_column(sa.Column('question_type', sa.String(length=40), nullable=False, server_default='numeric'))
        batch_op.add_column(sa.Column('effort', sa.String(length=10), nullable=False, server_default='quick'))
        batch_op.drop_column('kind')
