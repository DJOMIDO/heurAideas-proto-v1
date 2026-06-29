# backend/alembic/versions/97e1062577c9_add_documents_table.py

"""add documents table

Revision ID: documents_v1
Revises: 
Create Date: 2024-05-20 12:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa # pyright: ignore[reportMissingImports]

revision: str = 'documents_v1'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table('documents',
        sa.Column('id', sa.String(length=100), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('parent_id', sa.String(length=100), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('type', sa.String(length=20), nullable=False),
        sa.Column('extension', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('storage_path', sa.String(length=500), nullable=True),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('mime_type', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ),
        sa.ForeignKeyConstraint(['parent_id'], ['documents.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_documents_id'), 'documents', ['id'], unique=False)
    op.create_index(op.f('ix_documents_parent_id'), 'documents', ['parent_id'], unique=False)
    op.create_index(op.f('ix_documents_project_id'), 'documents', ['project_id'], unique=False)
    op.create_index(op.f('ix_documents_storage_path'), 'documents', ['storage_path'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_documents_storage_path'), table_name='documents')
    op.drop_index(op.f('ix_documents_project_id'), table_name='documents')
    op.drop_index(op.f('ix_documents_parent_id'), table_name='documents')
    op.drop_index(op.f('ix_documents_id'), table_name='documents')
    op.drop_table('documents')