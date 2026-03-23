from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import agents, auth, projects
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["\u8ba4\u8bc1"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["\u9879\u76ee"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["\u667a\u80fd\u4f53"])


@app.get("/")
async def root():
    return {"message": "Mars Design Backend API", "version": settings.VERSION}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
