"""Inicializar arquitectura base y multiverso

Revision ID: b2d8ec20a4cc
Revises: 
Create Date: 2026-09-23 21:58:29.136166

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2d8ec20a4cc'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Añadimos las columnas, pero omitimos las reglas que confunden a SQLite
    op.add_column('escenas', sa.Column('escena_padre_id', sa.Integer(), nullable=True))
    op.add_column('escenas', sa.Column('mensaje_bifurcacion_id', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Para revertir, solo borramos las columnas y omitimos el "drop_constraint"
    op.drop_column('escenas', 'mensaje_bifurcacion_id')
    op.drop_column('escenas', 'escena_padre_id')