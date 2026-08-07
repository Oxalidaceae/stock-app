from sqlalchemy import (
    BigInteger, SmallInteger, String, Boolean, Date, DateTime,
    Numeric, ForeignKey, Column, CHAR, Text
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class Company(Base):
    __tablename__ = "companies"

    id              = Column(BigInteger, primary_key=True, autoincrement=True)
    corp_code       = Column(String(8),   unique=True, nullable=False)
    ticker          = Column(String(10),  unique=True)
    company_name    = Column(String(100), nullable=False)
    company_name_en = Column(String(100))
    market          = Column(String(10))
    sector          = Column(String(50))
    industry        = Column(String(100))
    ceo_name        = Column(String(50))
    listing_date    = Column(Date)
    fiscal_month    = Column(SmallInteger)
    homepage        = Column(String(200))
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime, server_default=func.now())
    updated_at      = Column(DateTime, server_default=func.now(), onupdate=func.now())


class StockPrice(Base):
    __tablename__ = "stock_prices"

    id           = Column(BigInteger, primary_key=True, autoincrement=True)
    company_id   = Column(BigInteger, ForeignKey("companies.id"), nullable=False)
    trade_date   = Column(Date, nullable=False)
    open_price   = Column(BigInteger)
    high_price   = Column(BigInteger)
    low_price    = Column(BigInteger)
    close_price  = Column(BigInteger, nullable=False)
    volume       = Column(BigInteger)
    market_cap   = Column(BigInteger)
    created_at   = Column(DateTime, server_default=func.now())


class Disclosure(Base):
    __tablename__ = "disclosures"

    id               = Column(BigInteger, primary_key=True, autoincrement=True)
    company_id       = Column(BigInteger, ForeignKey("companies.id"))
    rcept_no         = Column(String(14), unique=True, nullable=False)
    report_name      = Column(String(200), nullable=False)
    disclosure_type  = Column(String(50))
    rcept_date       = Column(Date, nullable=False)
    submitter        = Column(String(100))
    dart_url         = Column(String(300))
    created_at       = Column(DateTime, server_default=func.now())


class FinancialStatement(Base):
    __tablename__ = "financial_statements"

    id               = Column(BigInteger, primary_key=True, autoincrement=True)
    company_id       = Column(BigInteger, ForeignKey("companies.id"), nullable=False)
    fiscal_year      = Column(SmallInteger, nullable=False)
    report_code      = Column(String(5),   nullable=False)
    fs_div           = Column(String(3),   nullable=False)
    account_id       = Column(String(50))
    account_name     = Column(String(100), nullable=False)
    current_amount   = Column(BigInteger)
    previous_amount  = Column(BigInteger)
    currency         = Column(String(10),  default="KRW")
    created_at       = Column(DateTime, server_default=func.now())


class FinancialMetric(Base):
    __tablename__ = "financial_metrics"

    id               = Column(BigInteger, primary_key=True, autoincrement=True)
    company_id       = Column(BigInteger, ForeignKey("companies.id"), nullable=False)
    base_date        = Column(Date, nullable=False)
    fiscal_year      = Column(SmallInteger)
    report_code      = Column(String(5))
    per              = Column(Numeric(10, 2))
    pbr              = Column(Numeric(10, 2))
    psr              = Column(Numeric(10, 2))
    ev_ebitda        = Column(Numeric(10, 2))
    roe              = Column(Numeric(10, 2))
    roa              = Column(Numeric(10, 2))
    operating_margin = Column(Numeric(10, 2))
    net_margin       = Column(Numeric(10, 2))
    debt_ratio       = Column(Numeric(10, 2))
    current_ratio    = Column(Numeric(10, 2))
    dividend_yield   = Column(Numeric(6, 2))
    dps              = Column(BigInteger)
    eps              = Column(BigInteger)
    bps              = Column(BigInteger)
    revenue          = Column(BigInteger)
    operating_income = Column(BigInteger)
    net_income       = Column(BigInteger)
    total_assets     = Column(BigInteger)
    total_equity     = Column(BigInteger)
    created_at       = Column(DateTime, server_default=func.now())


class EconomicIndicator(Base):
    __tablename__ = "economic_indicators"

    id          = Column(BigInteger, primary_key=True, autoincrement=True)
    stat_code   = Column(String(10),  nullable=False)
    stat_name   = Column(String(100), nullable=False)
    item_code   = Column(String(50),  nullable=False)
    item_name   = Column(String(200), nullable=False)
    period      = Column(String(10),  nullable=False)
    period_type = Column(CHAR(1),     nullable=False)
    value       = Column(Numeric(20, 4))
    unit        = Column(String(20))
    created_at  = Column(DateTime, server_default=func.now())


class MacroKeystat(Base):
    __tablename__ = "macro_keystats"

    id           = Column(BigInteger, primary_key=True, autoincrement=True)
    class_name   = Column(String(50),  nullable=False)
    keystat_name = Column(String(100), nullable=False)
    value        = Column(String(50))
    unit         = Column(String(20))
    cycle        = Column(String(20))
    sort_order   = Column(BigInteger)
    updated_at   = Column(DateTime, server_default=func.now(), onupdate=func.now())


class MacroKeystatHistory(Base):
    """100대 통계지표 시계열. cycle 이 바뀔 때만 새 행 추가."""
    __tablename__ = "macro_keystat_history"

    id           = Column(BigInteger, primary_key=True, autoincrement=True)
    class_name   = Column(String(50),  nullable=False)
    keystat_name = Column(String(100), nullable=False)
    value        = Column(String(50))
    unit         = Column(String(20))
    cycle        = Column(String(20))
    recorded_at  = Column(DateTime, server_default=func.now())


class PolicyBriefing(Base):
    """부처 보도자료 RSS — "경제 소식". link 기준 중복 제거."""
    __tablename__ = "policy_briefing"

    id           = Column(BigInteger, primary_key=True, autoincrement=True)
    title        = Column(String(500), nullable=False)
    summary      = Column(Text)
    ministry     = Column(String(100))
    source       = Column(String(50))
    link         = Column(String(1000), nullable=False, unique=True)
    published_at = Column(DateTime)
    collected_at = Column(DateTime, server_default=func.now())
    editor_note        = Column(Text)
    impact_tags        = Column(String(500))
    related_indicators = Column(String(500))
    editorial_status   = Column(String(20), nullable=False, server_default="COLLECTED")
    reviewed_by        = Column(BigInteger, ForeignKey("app_users.id"))
    reviewed_at        = Column(DateTime)
    updated_at         = Column(DateTime, server_default=func.now(), onupdate=func.now())

