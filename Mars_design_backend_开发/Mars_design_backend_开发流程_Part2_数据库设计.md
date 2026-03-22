# Mars Design 后端开发流程 - Part 2: 数据库设计

## 2.1 数据库表结构设计

### 核心表关系图
```
users (用户表)
  ↓ 1:N
projects (项目表)
  ↓ 1:N
├── designs (设计表)
├── agent_runs (Agent执行记录)
├── simulations (仿真记录)
└── exports (导出记录)

gene_modules (基因模块库) - 独立表，多对多关联到 designs
```

---

## 2.2 SQLAlchemy 模型实现

### 2.2.1 用户模型 (app/models/user.py)

```python
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 关系
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
```

---

### 2.2.2 项目模型 (app/models/project.py)

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # 项目配置 (JSON格式存储环境参数等)
    config_json = Column(JSON, default={})

    # 状态: draft, in_progress, completed
    status = Column(String, default="draft")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 关系
    owner = relationship("User", back_populates="projects")
    designs = relationship("Design", back_populates="project", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRun", back_populates="project", cascade="all, delete-orphan")
    simulations = relationship("Simulation", back_populates="project", cascade="all, delete-orphan")
    exports = relationship("Export", back_populates="project", cascade="all, delete-orphan")
```

---

### 2.2.3 基因模块模型 (app/models/gene_module.py)

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class GeneModule(Base):
    __tablename__ = "gene_modules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    module_type = Column(String, nullable=False)  # promoter, cds, terminator, etc.

    # 序列信息
    sequence = Column(Text, nullable=False)
    length = Column(Integer)

    # 功能描述
    description = Column(Text)
    function = Column(String)

    # 来源信息
    source_organism = Column(String)
    source_database = Column(String)  # iGEM, NCBI, etc.
    external_id = Column(String)

    # 特性参数 (JSON格式)
    properties = Column(JSON, default={})

    # 版本控制
    version = Column(Integer, default=1)
    parent_id = Column(Integer, nullable=True)  # 指向父版本

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 关系
    designs = relationship("DesignModule", back_populates="module")
```

---

### 2.2.4 Agent执行记录模型 (app/models/agent_run.py)

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    # Agent信息
    agent_id = Column(String, nullable=False)  # env-parse, extremophile, etc.
    agent_name = Column(String, nullable=False)

    # 执行状态: pending, running, completed, failed
    status = Column(String, default="pending")

    # 输入输出 (JSONB格式)
    input_data = Column(JSON)
    output_data = Column(JSON)

    # 执行信息
    celery_task_id = Column(String, unique=True, index=True)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    duration_seconds = Column(Float)

    # 错误信息
    error_message = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关系
    project = relationship("Project", back_populates="agent_runs")
```

---

### 2.2.5 仿真记录模型 (app/models/simulation.py)

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    design_id = Column(Integer, ForeignKey("designs.id"), nullable=True)

    name = Column(String, nullable=False)
    simulation_type = Column(String, nullable=False)  # FBA, kinetic, structural

    # 仿真参数
    parameters = Column(JSON, nullable=False)

    # 仿真结果
    results = Column(JSON)

    # 状态: pending, running, completed, failed
    status = Column(String, default="pending")

    # 执行信息
    celery_task_id = Column(String, unique=True, index=True)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    duration_seconds = Column(Float)

    error_message = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关系
    project = relationship("Project", back_populates="simulations")
    design = relationship("Design", back_populates="simulations")
```

---

### 2.2.6 设计模型 (app/models/design.py)

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# 多对多关联表
design_modules = Table(
    'design_modules',
    Base.metadata,
    Column('design_id', Integer, ForeignKey('designs.id'), primary_key=True),
    Column('module_id', Integer, ForeignKey('gene_modules.id'), primary_key=True),
    Column('position', Integer),  # 模块在设计中的位置
    Column('orientation', String, default='forward')  # forward/reverse
)

class Design(Base):
    __tablename__ = "designs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)

    name = Column(String, nullable=False)
    description = Column(Text)

    # Canvas数据 (前端可视化编辑器状态)
    canvas_data = Column(JSON)

    # 验证结果
    validation_status = Column(String, default="pending")  # pending, valid, invalid
    validation_results = Column(JSON)

    # 版本控制
    version = Column(Integer, default=1)
    parent_id = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 关系
    project = relationship("Project", back_populates="designs")
    modules = relationship("GeneModule", secondary=design_modules, backref="designs")
    simulations = relationship("Simulation", back_populates="design")
    exports = relationship("Export", back_populates="design")
```

---

### 2.2.7 导出记录模型 (app/models/export.py)

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Export(Base):
    __tablename__ = "exports"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    design_id = Column(Integer, ForeignKey("designs.id"), nullable=True)

    # 导出格式: sbol, genbank, pdf, json
    format = Column(String, nullable=False)

    # 文件信息
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer)

    # 状态: pending, completed, failed
    status = Column(String, default="pending")

    error_message = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关系
    project = relationship("Project", back_populates="exports")
    design = relationship("Design", back_populates="exports")
```

---

## 2.3 初始化所有模型 (app/models/__init__.py)

```python
from app.models.user import User
from app.models.project import Project
from app.models.gene_module import GeneModule
from app.models.agent_run import AgentRun
from app.models.simulation import Simulation
from app.models.design import Design, design_modules
from app.models.export import Export

__all__ = [
    "User",
    "Project",
    "GeneModule",
    "AgentRun",
    "Simulation",
    "Design",
    "Export",
    "design_modules"
]
```

---

**Part 2 完成**

下一部分将讲解 Alembic 数据库迁移配置。
