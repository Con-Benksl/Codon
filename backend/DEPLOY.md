# Railway 部署指南

## 前置准备

1. 注册 [Railway.app](https://railway.app) 账号
2. 将代码推送到 GitHub 仓库
3. 准备生产环境的 SECRET_KEY（运行 `openssl rand -hex 32` 生成）

## 部署步骤

### 第一步：创建 Railway 项目

1. 登录 Railway，点击 **New Project**
2. 选择 **Deploy from GitHub repo**
3. 授权并选择 `Mars_design` 仓库
4. Railway 会自动检测到 `backend` 目录

### 第二步：添加数据库服务

1. 在项目中点击 **+ New**
2. 选择 **Database** → **Add PostgreSQL**
3. 再次点击 **+ New**
4. 选择 **Database** → **Add Redis**

### 第三步：配置后端服务环境变量

在 Backend 服务的 **Variables** 标签页添加：

DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
CELERY_BROKER_URL=${{Redis.REDIS_URL}}/0
CELERY_RESULT_BACKEND=${{Redis.REDIS_URL}}/1
SECRET_KEY=<使用 openssl rand -hex 32 生成的密钥>
CORS_ORIGINS=["https://your-frontend-domain.vercel.app"]

### 第四步：部署 Celery Worker（可选）

如果需要异步任务支持：

1. 点击 **+ New** → **Empty Service**
2. 命名为 `celery-worker`
3. 在 **Settings** → **Source** 中连接同一个 GitHub 仓库
4. 在 **Settings** → **Deploy** 中设置：
   - **Root Directory**: `backend`
   - **Start Command**: `bash railway-celery.sh`
5. 复制后端服务的所有环境变量到 Celery Worker

### 第五步：验证部署

1. 等待构建完成（约 3-5 分钟）
2. 点击 Backend 服务，复制生成的域名（如 `https://xxx.railway.app`）
3. 访问以下端点验证：
   - `https://xxx.railway.app/` - 基本信息
   - `https://xxx.railway.app/health` - 健康检查
   - `https://xxx.railway.app/api/docs` - API 文档

### 第六步：更新前端配置

将前端项目的 API 地址更新为 Railway 提供的域名。

## 故障排查

### 构建失败

- 检查 **Deployments** 标签页的构建日志
- 确认 `requirements.txt` 中的依赖版本兼容

### 服务启动失败

- 检查 **Deployments** 标签页的运行日志
- 确认所有环境变量已正确配置
- 验证数据库连接字符串格式

### 数据库迁移失败

- 手动运行迁移：在 Railway 服务中打开 **Shell**，执行 `alembic upgrade head`
- 检查 `alembic/versions/` 中的迁移文件

### CORS 错误

- 确认 `CORS_ORIGINS` 包含前端实际域名
- 格式必须是 JSON 数组：`["https://domain1.com","https://domain2.com"]`

## 成本估算

- **Hobby Plan**: $5/月（包含 $5 免费额度）
- **PostgreSQL**: 共享实例免费
- **Redis**: 共享实例免费
- **预计总成本**: $0-5/月（取决于流量）

## 安全建议

1. ✅ 使用强 SECRET_KEY（至少 32 字节）
2. ✅ 限制 CORS_ORIGINS 为实际域名
3. ✅ 定期更新依赖：`pip list --outdated`
4. ✅ 启用 Railway 的自动 HTTPS
5. ✅ 不要在代码中硬编码敏感信息
