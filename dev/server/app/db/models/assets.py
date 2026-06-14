from app.db.base import Base
from sqlalchemy import UniqueConstraint, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

class Asset(Base):
    __tablename__ = "assets"
    __table_args__ = (
        UniqueConstraint("symbol", "exchange", name="uq_assets_symbol_exchange"),
    )

    asset_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, nullable=False)
    symbol: Mapped[str] = mapped_column(String(20), nullable=False)
    company_name: Mapped[str] = mapped_column(String(100), nullable=False)
    legal_entity_name: Mapped[str | None] = mapped_column(String(100))
    exchange: Mapped[str | None] = mapped_column(String(50))
    asset_type: Mapped[str | None] = mapped_column(String(50))
    sector: Mapped[str | None] = mapped_column(String(100))
    industry: Mapped[str | None] = mapped_column(String(100))
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="True")
    created_on: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )
    last_updated: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

