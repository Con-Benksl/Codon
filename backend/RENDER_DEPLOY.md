# Render 部署指南

> 推荐生产路径：Supabase 建库 → GitHub 授权 Render → 自动部署。
> 全部网页操作，零命令行。

---

## 0. 准备：在 Supabase 创建免费 PostgreSQL（5 分钟）

1. 访问 https://supabase.com → Sign in with GitHub
2. New Project：
   - Name: `codon`
   - Database Password: 自己设一个（**记下来**）
   - Region: `Northeast Asia (Tokyo)`（离国内最近）
   - Plan: Free
3. 等约 2 分钟项目创建完成
4. 进入项目 → 左侧 **Project Settings** → **Database** → **Connection string**
5. 选 **URI** → 选 **Session pooler** 模式（**Direct connection 模式 IPv6 only，Render 不通**）
6. 复制完整连接串。格式类似：
   ```
   postgresql://<database-user>@<pooler-host>:5432/postgres
   ```
7. 确认连接串包含步骤 2 设的真实密码。不要把完整连接串提交到仓库。

把这个完整 URL 存到记事本，下面要用。

---

## 1. 在 Render 部署后端

### 方式 A：Blueprint（推荐，一键部署）

1. 访问 https://render.com → Sign in with GitHub
2. New + → **Blueprint**
3. Connect Repository → 选择你的 `Codon` 仓库
4. Render 自动检测仓库根目录的 `render.yaml`，显示要部署的服务
5. 点 **Apply**
6. 在弹出的环境变量面板填入：

   | 变量 | 值 |
   |------|---|
   | `DATABASE_URL` | 步骤 0 的 Supabase URI |
   | `SECRET_KEY` | 在终端跑 `openssl rand -hex 32` 生成 |
   | `LLM_API_KEY` | OpenAI-compatible API key，可留空以使用本地规则兜底 |
   | `LLM_BASE_URL` | OpenAI-compatible endpoint，例如 `https://api.openai.com/v1` |
   | `LLM_MODEL` | 对应 endpoint 支持的模型名 |
   | `CORS_ORIGINS` | 暂填 `["*"]`，前端域名定下来后改为 `["https://你的vercel.app"]` |

7. Render 开始构建（约 5-10 分钟，scipy/biopython/cobra 装得慢）
8. 构建完成后页面会显示一个公网域名，形如 `https://codon-backend.onrender.com`

### 方式 B：手动创建 Web Service（如果 Blueprint 报错）

1. New + → **Web Service** → 连接 `Codon` 仓库
2. 配置：
   - Name: `codon-backend`
   - Region: `Singapore`
   - Branch: `main`
   - Root Directory: `backend`
   - Runtime: `Docker`
   - Docker Command: `bash render-start.sh`
   - Plan: Free
3. 在 **Environment** 标签页添加上面的环境变量
4. 在 **Settings** → **Health Check Path** 填 `/health`
5. Create Web Service → 等待构建

---

## 2. 验证

构建完成后浏览器打开：

- `https://codon-backend.onrender.com/health` → 应返回 `{"status":"healthy"}`
- `https://codon-backend.onrender.com/api/docs` → 应看到 FastAPI Swagger

⚠️ **首次访问可能要等 30-60 秒**——Render 免费版有冷启动。后续 15 分钟无请求会休眠。

---

## 3. 更新前端 API 地址

在 Vercel 项目的环境变量里：

```
VITE_API_URL=https://codon-backend.onrender.com/api/v1
```

更新后重新部署前端。

回到 Render 后端的环境变量，把 `CORS_ORIGINS` 改为：

```
CORS_ORIGINS=["https://你的vercel域名.vercel.app"]
```

保存后 Render 会自动重启。

---

## 4. 应对冷启动（演示前必看）

Render 免费版 15 分钟无请求 → 休眠。下次访问要冷启动 30-60 秒。

**演示前保活策略**（任选其一）：

### A. 演示前手动唤醒
演示开始前 2 分钟在浏览器访问一次 `https://codon-backend.onrender.com/health`，让它热起来。

### B. UptimeRobot 免费保活
1. 注册 https://uptimerobot.com（免费）
2. New Monitor → HTTP(s) → URL 填 `https://codon-backend.onrender.com/health` → 间隔 5 分钟
3. 每 5 分钟自动 ping 一次，永不休眠

### C. 升级 Starter（$7/月）
彻底不休眠 + 更多 CPU/内存。仅长期项目考虑。

---

## 5. 数据库迁移（如果已有旧数据库要保留）

先从旧数据库导出，再导入 Supabase。不要把真实连接串提交到仓库。

```bash
# 导出旧数据库；OLD_DATABASE_URL 只放在本地 shell，不要提交
OLD_DATABASE_URL="<old database URL>"
pg_dump "$OLD_DATABASE_URL" > /tmp/codon_backup.sql

# 导入 Supabase
psql "<Supabase URI>" < /tmp/codon_backup.sql
```

如果之前没多少数据，**直接跳过这步**——Alembic 迁移会自动建空表。

---

## 常见问题

### 构建失败：内存不足
Render 免费版构建容器有 512MB 限制。`scipy + biopython + cobra` 装起来吃内存。
- **解决**：Settings → Build Command 改为 `pip install --no-cache-dir -r requirements.txt`（已在 Dockerfile 里）；如还是 OOM，临时升 Starter 跑一次构建，构建完降回 Free

### Alembic 迁移报错 `relation already exists`
Supabase 默认有一些 schema。如果出现冲突：
- 进 Supabase Dashboard → SQL Editor → 执行 `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
- 重新部署

### 504 Gateway Timeout
后端启动太慢，超过 Render 默认 90s 启动窗口。
- Dockerfile 已设 `HEALTHCHECK --start-period=40s`，应该够用
- 若还报 504，Settings → Health & Alerts 把 Start Period 调到 120s

### CORS 错误
- 确认 `CORS_ORIGINS` 是 JSON 数组字符串：`["https://xxx.vercel.app"]`，含方括号和引号
- 改完环境变量必须**重启服务**才生效

---

## 月度成本

| 服务 | 平台 | 免费额度 | 超出后 |
|------|------|---------|--------|
| 后端 Web | Render | 750 小时/月（够 1 实例 24x7） | $7/月 |
| PostgreSQL | Supabase | 500MB 存储 + 5GB 流量 | $25/月 |
| 监控保活 | UptimeRobot | 50 个监控 | 免费够用 |
| **合计** | | **¥0** | / |
