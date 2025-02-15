"""pledge_splits.issue_id_unique

Revision ID: ce3da2ba3f0a
Revises: 832d6aef46d6
Create Date: 2023-08-10 14:00:15.326444

"""
from alembic import op
import sqlalchemy as sa


# Polar Custom Imports
from polar.kit.extensions.sqlalchemy import PostgresUUID

# revision identifiers, used by Alembic.
revision = 'ce3da2ba3f0a'
down_revision = '832d6aef46d6'
branch_labels: tuple[str] | None = None
depends_on: tuple[str] | None = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_unique_constraint(op.f('pledge_splits_issue_id_key'), 'pledge_splits', ['issue_id'])
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(op.f('pledge_splits_issue_id_key'), 'pledge_splits', type_='unique')
    # ### end Alembic commands ###
