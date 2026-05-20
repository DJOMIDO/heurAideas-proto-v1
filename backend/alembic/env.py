from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool # pyright: ignore[reportMissingImports]
from alembic import context
import os
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# 导入配置 & 所有模型（14 张旧表 + 1 张新表）
from app.core.config import settings
from app.database import Base
from app.models import (
    User,
    ProjectTemplate, TemplateStep, TemplateSubstep, TemplateSubtask,
    Project, ProjectStep, ProjectSubstep, ProjectSubtask, SubstepContent, Attachment,
    Stakeholder,
    Comment,
    ProjectMember,
    Document,
)

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 使用 Base.metadata 自动聚合所有已导入模型的表结构
target_metadata = Base.metadata

def get_url():
    # 优先读环境变量，降级到 alembic.ini
    return os.getenv("DATABASE_URL") or config.get_main_option("sqlalchemy.url")

def run_migrations_offline() -> None:
    url = get_url()
    context.configure(
        url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(configuration, prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()