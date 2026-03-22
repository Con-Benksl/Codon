# MARTIAN BIOLAB AI

**火星定植生物体 多智能体设计系统**

一个面向火星生物定植任务的前端设计原型，模拟多智能体协作流程，涵盖从环境分析、基因合成装配、环境仿真到最终输出验证的完整生物工程设计链路。

---

## 技术栈

- **React 19** + **TypeScript 5**
- **Vite 6** 构建工具
- **Tailwind CSS v4** + 自定义设计 Token
- **Framer Motion (motion/react)** 动画系统
- **React Router v7** 路由管理
- **Lucide React** 图标库

---

## 视图模块

| 路由 | 视图 | 功能 |
|------|------|------|
| `/orchestrator` | 协调者 | 多智能体任务编排、约束管理、系统状态监控 |
| `/environment` | 环境层 | 火星地点选择、环境参数分析（Jezero / Valles Marineris / Gale / Utopia） |
| `/synthesis` | 合成层 | 基因模块装配画布、SBOL 可视化、编译验证 |
| `/simulation` | 仿真层 | 环境参数调节、多物种存活率仿真、SOL 时间轴 |
| `/output` | 输出层 | 多层次设计验证、打印队列、多格式导出 |

---

## 本地运行

**前提：** Node.js 18+

```bash
npm install
npm run dev
```

默认运行于 `http://localhost:3000`

```bash
npm run build    # 生产构建
npm run preview  # 预览构建产物
npm run clean    # 清理 dist 目录
```
