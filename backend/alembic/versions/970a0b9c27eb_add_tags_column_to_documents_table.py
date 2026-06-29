# backend/alembic/970a0b9c27eb_add_tags_column_to_documents_table.py

"""add tags column to documents table

Revision ID: 970a0b9c27eb
Revises: 764b1f99dff0
Create Date: 2026-06-17 09:57:59.363108

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa # pyright: ignore[reportMissingImports]

revision: str = '970a0b9c27eb'
down_revision: Union[str, Sequence[str], None] = '764b1f99dff0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('documents', sa.Column('tags', sa.JSON(), nullable=True))

def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('documents', 'tags')
