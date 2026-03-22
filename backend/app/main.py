from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.api.v1 import auth, agents, projects

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/v1/auth", tags=["认证"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["项目"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["智能体"])

@app.get("/")
async def root():
    return {"message": "Mars Design Backend API", "version": settings.VERSION}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
