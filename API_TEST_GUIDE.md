# API 测试指南

## 环境准备

### 后端服务
```bash
cd backend
python -m uvicorn app.main:app --reload
```
运行在: http://127.0.0.1:8000

### 前端服务
```bash
cd frontend
npm run dev
```
运行在: http://localhost:3003

## API 文档

访问 http://127.0.0.1:8000/api/docs 查看完整的 Swagger 文档

## 测试流程

### 1. 用户认证测试

#### 注册用户
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'
```

#### 登录获取 Token
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=password123"
```

返回示例:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

### 2. 项目管理测试

#### 创建项目
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/projects/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "火星生物实验室",
    "description": "测试项目"
  }'
```

#### 获取项目列表
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/projects/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 获取单个项目
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/projects/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 更新项目
```bash
curl -X PUT "http://127.0.0.1:8000/api/v1/projects/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "active"
  }'
```

#### 删除项目
```bash
curl -X DELETE "http://127.0.0.1:8000/api/v1/projects/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Agent 编排测试

#### 启动 Agent 编排
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/agents/orchestrate" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": 1,
    "config": {
      "environment": "Mars",
      "temperature": -60
    }
  }'
```

#### 查询执行记录
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/agents/runs/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 前端测试

1. 访问 http://localhost:3003/login
2. 使用注册的账号登录
3. 登录成功后跳转到项目列表页
4. 测试创建、查看、删除项目功能
5. 访问 /orchestrator 测试 Agent 编排功能

## 常见问题

### CORS 错误
确保后端 `.env` 文件中配置了正确的前端地址:
```
CORS_ORIGINS=["http://localhost:3003"]
```

### Token 过期
Token 默认30分钟过期,需要重新登录获取新 Token
