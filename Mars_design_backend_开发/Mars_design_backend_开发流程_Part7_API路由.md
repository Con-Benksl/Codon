# Mars Design 后端开发流程 - Part 7: 完整 API 路由实现

## 7.1 项目管理 API

### 7.1.1 项目路由 (app/api/v1/projects.py)

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.services.auth_service import get_current_active_user

router = APIRouter()

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建新项目"""
    db_project = Project(
        **project.dict(),
        owner_id=current_user.id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户的项目列表"""
    projects = db.query(Project).filter(
        Project.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取项目详情"""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="项目不存在")

    return project

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新项目"""
    db_project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()

    if not db_project:
        raise HTTPException(status_code=404, detail="项目不存在")

    # 更新字段
    update_data = project_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_project, field, value)

    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除项目"""
    db_project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()

    if not db_project:
        raise HTTPException(status_code=404, detail="项目不存在")

    db.delete(db_project)
    db.commit()
    return None
```

---

## 7.2 基因模块管理 API

### 7.2.1 模块 Schemas (app/schemas/module.py)

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class GeneModuleBase(BaseModel):
    name: str
    module_type: str
    sequence: str
    description: Optional[str] = None
    function: Optional[str] = None
    source_organism: Optional[str] = None
    source_database: Optional[str] = None
    properties: Optional[Dict[str, Any]] = {}

class GeneModuleCreate(GeneModuleBase):
    pass

class GeneModuleResponse(GeneModuleBase):
    id: int
    length: Optional[int]
    version: int
    created_at: datetime

    class Config:
        from_attributes = True
```

### 7.2.2 模块路由 (app/api/v1/modules.py)

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.gene_module import GeneModule
from app.schemas.module import GeneModuleCreate, GeneModuleResponse
from app.services.auth_service import get_current_active_user

router = APIRouter()

@router.post("/", response_model=GeneModuleResponse, status_code=201)
async def create_module(
    module: GeneModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建基因模块"""
    db_module = GeneModule(
        **module.dict(),
        length=len(module.sequence)
    )
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    return db_module

@router.get("/", response_model=List[GeneModuleResponse])
async def list_modules(
    module_type: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取基因模块列表"""
    query = db.query(GeneModule)

    if module_type:
        query = query.filter(GeneModule.module_type == module_type)

    if search:
        query = query.filter(
            GeneModule.name.ilike(f"%{search}%")
        )

    modules = query.offset(skip).limit(limit).all()
    return modules

@router.get("/{module_id}", response_model=GeneModuleResponse)
async def get_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取模块详情"""
    module = db.query(GeneModule).filter(GeneModule.id == module_id).first()
    if not module:
        raise HTTPException(status_code=404, detail="模块不存在")
    return module
```

---

## 7.3 仿真管理 API

### 7.3.1 仿真 Schemas (app/schemas/simulation.py)

```python
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class SimulationCreate(BaseModel):
    project_id: int
    design_id: Optional[int] = None
    name: str
    simulation_type: str  # FBA, kinetic, structural
    parameters: Dict[str, Any]

class SimulationResponse(BaseModel):
    id: int
    project_id: int
    design_id: Optional[int]
    name: str
    simulation_type: str
    parameters: Dict[str, Any]
    results: Optional[Dict[str, Any]]
    status: str
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True
```

### 7.3.2 仿真路由 (app/api/v1/simulations.py)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.simulation import Simulation
from app.schemas.simulation import SimulationCreate, SimulationResponse
from app.services.auth_service import get_current_active_user
from app.services.simulation_engine import SimulationEngine

router = APIRouter()

@router.post("/", response_model=SimulationResponse, status_code=201)
async def create_simulation(
    simulation: SimulationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """创建并运行仿真"""
    db_simulation = Simulation(**simulation.dict(), status="pending")
    db.add(db_simulation)
    db.commit()
    db.refresh(db_simulation)

    # 异步运行仿真
    engine = SimulationEngine()
    if simulation.simulation_type == "FBA":
        results = await engine.run_fba_simulation(simulation.parameters)
    elif simulation.simulation_type == "kinetic":
        results = await engine.run_kinetic_simulation(simulation.parameters)
    else:
        raise HTTPException(status_code=400, detail="不支持的仿真类型")

    # 更新结果
    db_simulation.results = results
    db_simulation.status = results.get("status", "completed")
    db.commit()
    db.refresh(db_simulation)

    return db_simulation

@router.get("/{project_id}", response_model=List[SimulationResponse])
async def list_simulations(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取项目的仿真列表"""
    simulations = db.query(Simulation).filter(
        Simulation.project_id == project_id
    ).all()
    return simulations
```

---

**Part 7 完成**

下一部分将讲解测试与部署。
