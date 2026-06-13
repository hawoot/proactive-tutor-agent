"""nudge times (specific clock times, replacing allowed windows)

Revision ID: c1a2b3d4e5f6
Revises: 7412e427de21
Create Date: 2026-06-13 11:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'c1a2b3d4e5f6'
down_revision = '7412e427de21'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'nudge_times',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('weekday', sa.Integer(), nullable=False),
        sa.Column('hour', sa.Integer(), nullable=False),
        sa.Column('minute', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(
            ['user_id'], ['users.id'],
            name=op.f('fk_nudge_times_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_nudge_times')),
    )
    with op.batch_alter_table('nudge_times', schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f('ix_nudge_times_user_id'), ['user_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('nudge_times', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_nudge_times_user_id'))
    op.drop_table('nudge_times')
