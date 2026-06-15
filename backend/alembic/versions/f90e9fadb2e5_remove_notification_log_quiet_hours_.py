"""remove notification_log, quiet hours, prompt cap

The server-push outbox (notification_log) and the server-side nudge fence
(quiet hours, per-day prompt cap) are gone: reminders fire on the device now.
This drops the orphaned table and columns.

Revision ID: f90e9fadb2e5
Revises: c6d7e8f9a0b1
Create Date: 2026-06-15 17:20:34.968756

"""
from alembic import op
import sqlalchemy as sa


revision = 'f90e9fadb2e5'
down_revision = 'c6d7e8f9a0b1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('notification_log', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_notification_log_sent_at'))
        batch_op.drop_index(batch_op.f('ix_notification_log_status'))
        batch_op.drop_index(batch_op.f('ix_notification_log_user_id'))
    op.drop_table('notification_log')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('quiet_hours_end')
        batch_op.drop_column('quiet_hours_start')
        batch_op.drop_column('max_prompts_per_day')


def downgrade() -> None:
    # server_default so existing rows backfill cleanly (matches the old defaults)
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('max_prompts_per_day', sa.INTEGER(),
                                      nullable=False, server_default='4'))
        batch_op.add_column(sa.Column('quiet_hours_start', sa.INTEGER(),
                                      nullable=False, server_default='21'))
        batch_op.add_column(sa.Column('quiet_hours_end', sa.INTEGER(),
                                      nullable=False, server_default='8'))

    op.create_table('notification_log',
    sa.Column('id', sa.INTEGER(), nullable=False),
    sa.Column('user_id', sa.INTEGER(), nullable=False),
    sa.Column('device_id', sa.INTEGER(), nullable=True),
    sa.Column('channel', sa.VARCHAR(length=40), nullable=False),
    sa.Column('body', sa.TEXT(), nullable=False),
    sa.Column('status', sa.VARCHAR(length=20), nullable=False),
    sa.Column('error', sa.TEXT(), nullable=False),
    sa.Column('sent_at', sa.DATETIME(), nullable=False),
    sa.Column('channel_ref', sa.VARCHAR(length=300), server_default=sa.text("('')"), nullable=False),
    sa.Column('attempts', sa.INTEGER(), server_default=sa.text("'0'"), nullable=False),
    sa.Column('delivered_at', sa.DATETIME(), nullable=True),
    sa.ForeignKeyConstraint(['device_id'], ['devices.id'], name=op.f('fk_notification_log_device_id_devices'), ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_notification_log_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_notification_log'))
    )
    with op.batch_alter_table('notification_log', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_notification_log_user_id'), ['user_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_notification_log_status'), ['status'], unique=False)
        batch_op.create_index(batch_op.f('ix_notification_log_sent_at'), ['sent_at'], unique=False)
