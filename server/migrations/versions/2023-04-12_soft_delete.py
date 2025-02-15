"""soft delete

Revision ID: a67ffc6928ab
Revises: e652369d0a02
Create Date: 2023-04-12 09:31:48.602594

"""
from alembic import op
import sqlalchemy as sa


# Polar Custom Imports

# revision identifiers, used by Alembic.
revision = "a67ffc6928ab"
down_revision = "e652369d0a02"
branch_labels: tuple[str] | None = None
depends_on: tuple[str] | None = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "accounts", sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True)
    )
    op.add_column(
        "issue_dependencies",
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.add_column(
        "issue_references",
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.add_column(
        "issues", sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True)
    )
    op.add_column(
        "notifications",
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.add_column(
        "oauth_accounts",
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.add_column(
        "organizations",
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.add_column(
        "pledges", sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True)
    )
    op.add_column(
        "pull_requests",
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.add_column(
        "repositories",
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.add_column(
        "user_organization_settings",
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.add_column(
        "user_organizations",
        sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.drop_column("user_organizations", "status")
    op.add_column(
        "users", sa.Column("deleted_at", sa.TIMESTAMP(timezone=True), nullable=True)
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("users", "deleted_at")
    op.add_column(
        "user_organizations",
        sa.Column("status", sa.INTEGER(), autoincrement=False, nullable=False),
    )
    op.drop_column("user_organizations", "deleted_at")
    op.drop_column("user_organization_settings", "deleted_at")
    op.drop_column("repositories", "deleted_at")
    op.drop_column("pull_requests", "deleted_at")
    op.drop_column("pledges", "deleted_at")
    op.drop_column("organizations", "deleted_at")
    op.drop_column("oauth_accounts", "deleted_at")
    op.drop_column("notifications", "deleted_at")
    op.drop_column("issues", "deleted_at")
    op.drop_column("issue_references", "deleted_at")
    op.drop_column("issue_dependencies", "deleted_at")
    op.drop_column("accounts", "deleted_at")
    # ### end Alembic commands ###
