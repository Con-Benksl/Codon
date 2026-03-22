# Railway 部署指南

## 1. 准备工作

访问 [Railway.app](https://railway.app) 并登录

## 2. 创建项目

1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择你的 Mars_design 仓库
4. 选择 `backend` 目录

## 3. 添加数据库和 Redis

在项目中点击 "New" 添加：
- PostgreSQL
- Redis

## 4. 配置环境变量

在后端服务的 Variables 中添加：

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=https://your-frontend.vercel.app
```

## 5. 部署

Railway 会自动检测 Dockerfile 并部署

## 6. 更新前端 API 地址

将前端的 API_BASE_URL 改为 Railway 提供的域名
