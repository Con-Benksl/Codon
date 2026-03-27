# Mars Design 项目部署指南

## 项目结构

```
Mars_design/
├── backend/          # FastAPI 后端
├── frontend/         # React 前端
├── .env             # 环境变量配置
└── README.md
```

## 后端部署

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置环境变量

创建 `backend/.env` 文件:

```env
APP_NAME=Mars Design Backend
VERSION=1.0.0
DATABASE_URL=sqlite:///./mars_design.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=["http://localhost:3003"]
```

### 3. 初始化数据库

```bash
python -m app.database
```

### 4. 启动服务

开发环境:
```bash
python -m uvicorn app.main:app --reload --port 8000
```

生产环境:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 前端部署

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 配置 API 地址

修改 `frontend/src/api/client.ts` 中的 baseURL:

```typescript
export const apiClient = axios.create({
  baseURL: 'http://your-backend-url/api/v1',
});
```

### 3. 构建生产版本

```bash
npm run build
```

### 4. 部署

将 `dist/` 目录部署到静态服务器 (Nginx, Apache, Vercel 等)

Nginx 配置示例:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## Docker 部署 (可选)

### 后端 Dockerfile

创建 `backend/Dockerfile`:

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 前端 Dockerfile

创建 `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

### Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///./mars_design.db
      - SECRET_KEY=your-secret-key
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

启动:
```bash
docker-compose up -d
```
