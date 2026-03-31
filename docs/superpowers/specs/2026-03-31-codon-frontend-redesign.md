# Codon — 前端重构设计规格

> 合成生物学 AI 多智能体协作平台，前端全面重构。

## 1. 产品概述

**产品名**：Codon
**定位**：合成生物学 AI 多智能体协作平台
**目标用户**：合成生物学研究员、生物工程师、学生
**核心功能**：
- 多 AI Agent 协作设计生物序列 / 基因回路
- 生物实验项目管理 + AI 辅助分析

**范围**：仅前端。后端 API 和 Agent 系统在前端完成后重新设计。保留现有 Login 逻辑，其余页面全部推翻重做。

## 2. 设计系统

### 2.1 视觉风格

**方向**：Maze 深色克制风（mazehq.com 参考）
- 深蓝黑底，高对比度白色文本
- 单一亮点色（青蓝），不做多色光晕
- 超大标题排版（紧凑 letter-spacing）
- 极简卡片（极淡背景 + 细边框 + 12px 圆角）
- 克制动画（滚动触发 fade-in，无脉冲/呼吸/blur）
- DNA 双螺旋粒子作为全局核心视觉元素

### 2.2 色盘

| Token | Value | 用途 |
|-------|-------|------|
| `--bg` | `#0F1523` | 页面背景 |
| `--surface` | `#0a0e1a` | 侧边栏/面板背景 |
| `--card` | `rgba(242,244,245,0.04)` | 卡片背景 |
| `--border` | `rgba(255,255,255,0.06)` | 边框 |
| `--border-hover` | `rgba(255,255,255,0.12)` | 悬停边框 |
| `--primary` | `#38bdf8` | 主交互色（青蓝） |
| `--danger` | `#f43f5e` | 危险/错误 |
| `--success` | `#4ade80` | 成功/活跃 |
| `--text` | `#ffffff` | 主文本 |
| `--text-muted` | `rgba(255,255,255,0.45)` | 次要文本 |
| `--text-dim` | `rgba(255,255,255,0.25)` | 辅助信息 |

### 2.3 字体

| 用途 | 字体 | Weight | 特性 |
|------|------|--------|------|
| Headline | Instrument Sans | 500 | letter-spacing: -1.5px |
| Body | Inter | 400 | line-height: 1.6 |
| Data/Mono | JetBrains Mono | 400 | 序列、数值显示 |
| 中文 fallback | Noto Sans SC | — | — |

### 2.4 组件规范

**卡片**：
- 背景 `var(--card)`
- 边框 `1px solid var(--border)`
- 圆角 12px
- hover: 边框变亮至 `var(--border-hover)`
- 无 box-shadow，无 blur

**按钮**：
- Primary: 背景 `var(--primary)`，文字 `var(--bg)`，圆角 8px
- Ghost: 透明背景，边框 `var(--border)`，文字 `var(--text-muted)`
- 无光晕，hover 仅亮度变化

**标签/Badge**：
- 10px 大小，uppercase，圆角 4px
- 状态色：Active=success, In Progress=primary, Draft=muted

**导航激活态**：底部 2px 线或背景高亮，不使用 layoutId 动画下划线

### 2.5 动画约束

- 页面切换：简单 opacity fade（motion/react viewTransition）
- 列表进入：stagger fadeSlideUp
- 卡片悬停：translateY(-2px)，不做 10px 大幅浮起
- 禁止：玻璃态 blur、脉冲光晕、呼吸效果、星场粒子、多色渐变
- DNA 粒子动画由 Three.js 独立处理，不走 motion/react

## 3. 导航与布局

### 3.1 双模式导航

**首页（Home）**：顶部横向导航栏
- Logo 左侧：`◇ CODON`
- 导航链接居中/右侧：Home / Projects / Designer / Chat / Analysis
- 右侧 CTA 按钮
- 全屏沉浸式，无侧边栏

**工作区（Projects / Designer / Chat / Analysis）**：左侧垂直侧边栏
- 顶部 Logo
- 导航项（icon + label）
- Recent Projects 列表（状态色点 + 项目名）
- 侧边栏可折叠
- 底部用户头像 + 设置/语言切换

### 3.2 路由结构

```
/login          → LoginView（保留现有逻辑，样式重做）
/               → HomeView（全屏沉浸式首页）
/projects       → ProjectsView（项目列表）
/designer       → DesignerView（序列/回路设计器）
/chat           → ChatView（AI 对话）
/analysis       → AnalysisView（分析验证）
/*              → 重定向到 /
```

### 3.3 布局组件

- `HomeLayout.tsx`：顶部导航 + 全屏内容区
- `AppLayout.tsx`：侧边栏 + 主内容区
- 两个 Layout 共享 DNA 粒子背景组件

## 4. 页面设计

### 4.1 Home（首页）

- DNA 双螺旋粒子全屏背景（透明度 15-20%）
- 居中大标题："Design Life, Sequence by Sequence"
- 副标题说明平台用途
- 两个 CTA 按钮：Start Designing（primary）/ View Demo（ghost）
- 底部统计条：Agents 数 / Sequences Designed / Validation Rate
- 顶部横向导航

### 4.2 Projects（项目管理）

- 页面标题 + "New Project" 按钮
- 项目卡片网格（2 列）
- 每张卡片：项目名 + 状态 badge + 描述 + 元数据（序列数、更新时间）
- 空态：虚线卡片 "+" New Project
- AI 辅助创建：输入描述 → AI 提取项目名和描述（保留现有逻辑）
- 删除确认

### 4.3 Designer（设计器）

- 核心工作区，具体交互设计在后端 Agent 系统确定后细化
- 初期为占位页面，展示项目选择器 + 基本序列输入/显示
- 后续迭代：基因回路可视化编辑器、序列面板、Agent 协作状态

### 4.4 Chat（AI 对话）

- 消息流（用户消息右侧，Agent 消息左侧）
- 输入框（底部固定，textarea + send 按钮）
- Agent 身份标识（头像/名称）
- 序列/代码块高亮渲染
- 加载状态指示器（简单 dot 动画，不做呼吸效果）

### 4.5 Analysis（分析验证）

- 初期为占位页面
- 后续迭代：序列质量评分、验证结果图表、报告导出

### 4.6 Login（登录注册）

- 保留现有认证逻辑（API 调用、JWT 存储、重定向）
- 样式重做匹配 Codon 设计系统
- 深色背景 + 简洁居中表单
- DNA 粒子作为背景装饰

## 5. DNA 双螺旋粒子系统

### 5.1 技术方案

- **渲染器**：Three.js WebGLRenderer（透明背景）
- **几何体**：BufferGeometry + 自定义顶点位置
- **材质**：自定义 ShaderMaterial（Vertex + Fragment Shader）
- **粒子数**：~3000 个点

### 5.2 双螺旋数学模型

两条链各 ~1500 粒子，沿参数方程分布：

```
链 A：
  x = radius * cos(θ)
  y = θ * pitch
  z = radius * sin(θ)

链 B（相位差 π）：
  x = radius * cos(θ + π)
  y = θ * pitch
  z = radius * sin(θ + π)
```

碱基对连接线：LineSegments 连接对应位置的 A/B 链粒子。

### 5.3 动画行为

- **自转**：整体绕 Y 轴缓慢旋转（0.001 rad/frame）
- **呼吸**：radius 在基础值 ±5% 间正弦波动
- **滚动响应**：scrollY 影响 pitch 值（滚动时螺旋松开/收紧）
- **鼠标视差**：鼠标位置驱动 camera 微小偏移（±2%）
- **页面切换透明度**：首页 15-20%，工作区页面 5%

### 5.4 性能考量

- requestAnimationFrame 循环
- 工作区页面降低粒子数或渲染频率
- 移动端：减少粒子数至 ~1000
- 使用 `devicePixelRatio` capped at 2

### 5.5 组件结构

```
components/
  DnaParticles.tsx    — React 组件包装，管理 Three.js 生命周期
                        props: opacity, interactive, particleCount
```

全局挂载在 Layout 层，通过 props 控制不同页面的表现。

## 6. 技术栈

### 保留

| 依赖 | 说明 |
|------|------|
| React 19 | 框架 |
| TypeScript ~5.8 | 类型系统 |
| Vite 6 | 构建工具 |
| Tailwind CSS 4 | 原子化样式 |
| motion/react 12 | 页面/组件动画 |
| React Router 7 | SPA 路由 |
| Axios | HTTP 客户端（apiClient 骨架保留） |
| Lucide React | 图标库 |

### 新增

| 依赖 | 说明 |
|------|------|
| three | WebGL 3D 渲染（DNA 粒子系统） |
| @types/three | Three.js 类型定义 |

### 移除

无依赖移除（现有依赖均可复用）。

### 字体加载

Google Fonts 引入 Instrument Sans + Inter + JetBrains Mono + Noto Sans SC。

## 7. 文件结构（目标）

```
src/
├── components/
│   ├── DnaParticles.tsx       — DNA 双螺旋粒子（Three.js）
│   ├── Sidebar.tsx            — 工作区侧边栏
│   ├── TopNav.tsx             — 首页顶部导航
│   ├── ProjectCard.tsx        — 项目卡片
│   ├── Badge.tsx              — 状态标签
│   ├── Avatar.tsx             — 用户头像
│   ├── ChatMessage.tsx        — 聊天消息
│   └── index.ts               — barrel exports
├── views/
│   ├── HomeLayout.tsx         — 首页布局（顶部导航 + 全屏）
│   ├── AppLayout.tsx          — 工作区布局（侧边栏 + 主区域）
│   ├── HomeView.tsx           — 首页
│   ├── LoginView.tsx          — 登录（逻辑保留，样式重做）
│   ├── ProjectsView.tsx       — 项目管理
│   ├── DesignerView.tsx       — 设计器（初期占位）
│   ├── ChatView.tsx           — AI 对话
│   └── AnalysisView.tsx       — 分析验证（初期占位）
├── api/
│   ├── client.ts              — Axios 实例（保留）
│   ├── auth.ts                — 认证 API（保留）
│   └── projects.ts            — 项目 API（保留）
├── i18n/                       — 国际化（保留，更新 key）
├── lib/
│   └── motion.ts              — motion 预设（精简）
├── App.tsx                     — 路由配置（重写）
├── main.tsx                    — 入口（保留）
└── index.css                   — Tailwind + CSS 变量（重写）
```

## 8. i18n

保留中英双语支持。翻译 key 全部重写匹配新页面结构。

## 9. 不在范围内

- 后端 API 重构
- Agent 系统设计
- Designer 页面的完整交互（依赖后端）
- Analysis 页面的完整图表（依赖数据源）
- 移动端原生适配（仅基础响应式）
