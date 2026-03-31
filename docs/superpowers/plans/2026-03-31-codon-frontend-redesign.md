# Codon Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the entire Mars_design1 frontend with Codon — a Maze-style dark, restrained design with DNA double-helix particle background, for a synthetic biology AI multi-agent platform.

**Architecture:** React 19 + TypeScript + Vite SPA. Two layout modes: HomeLayout (top nav, immersive fullscreen) and AppLayout (sidebar + main content). Global Three.js DNA particle background component shared between layouts. Login page preserved with restyled UI. All other pages rebuilt from scratch.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, motion/react 12, React Router 7, Three.js (new), Axios, Lucide React

**Spec:** `docs/superpowers/specs/2026-03-31-codon-frontend-redesign.md`

---

## File Structure (Target)

```
src/
├── components/
│   ├── DnaParticles.tsx        — Three.js DNA double-helix particle system
│   ├── TopNav.tsx              — Home page horizontal navigation bar
│   ├── Sidebar.tsx             — App workspace collapsible sidebar
│   ├── ProjectCard.tsx         — Project card component
│   ├── Badge.tsx               — Status badge (Active/InProgress/Draft)
│   ├── Avatar.tsx              — User avatar with fallback initials
│   ├── ChatMessage.tsx         — Chat message bubble
│   └── index.ts                — Barrel exports
├── views/
│   ├── HomeLayout.tsx          — Layout: TopNav + fullscreen content + DnaParticles
│   ├── AppLayout.tsx           — Layout: Sidebar + main content + DnaParticles (dimmed)
│   ├── HomeView.tsx            — Landing page (hero + stats)
│   ├── LoginView.tsx           — Auth (logic preserved, UI restyled)
│   ├── ProjectsView.tsx        — Project management CRUD
│   ├── DesignerView.tsx        — Sequence designer (placeholder)
│   ├── ChatView.tsx            — AI chat interface
│   └── AnalysisView.tsx        — Analysis dashboard (placeholder)
├── api/
│   ├── client.ts               — Axios instance (KEEP AS-IS)
│   ├── auth.ts                 — Auth API (KEEP AS-IS)
│   └── projects.ts             — Projects API (KEEP AS-IS)
├── i18n/
│   ├── context.tsx             — LocaleProvider (KEEP, update storage key)
│   └── locales/
│       ├── zh.ts               — Chinese translations (REWRITE)
│       └── en.ts               — English translations (REWRITE)
├── lib/
│   └── motion.ts               — Motion presets (REWRITE, simplified)
├── App.tsx                     — Router config (REWRITE)
├── main.tsx                    — Entry point (KEEP AS-IS)
├── ErrorBoundary.tsx           — Error boundary (KEEP AS-IS)
└── index.css                   — Tailwind + CSS variables (REWRITE)
```

**Files to DELETE** (no longer needed):
- `src/components/Starfield.tsx`
- `src/components/AmbientGlow.tsx`
- `src/components/TelemetryTicker.tsx`
- `src/components/AnalysisCard.tsx`
- `src/components/DesignCard.tsx`
- `src/components/EnvironmentalCard.tsx`
- `src/components/MarsStatusGlobe.tsx`
- `src/components/MarsDataGlobe.tsx`
- `src/components/ProceduralMarsGlobe.tsx`
- `src/components/DetailPanel.tsx`
- `src/components/FallbackImage.tsx`
- `src/components/AiChatWidget.tsx`
- `src/components/Icon.tsx`
- `src/components/nexus/` (entire directory)
- `src/components/orchestrator/` (entire directory)
- `src/components/synthesis/` (entire directory)
- `src/components/validation/` (entire directory)
- `src/components/command/` (entire directory)
- `src/components/settings/` (entire directory)
- `src/components/diagnostics/` (entire directory)
- `src/views/Layout.tsx` (replaced by HomeLayout + AppLayout)
- `src/views/OrchestratorView.tsx`
- `src/views/CommandView.tsx`
- `src/views/SynthesisView.tsx`
- `src/views/EnvironmentView.tsx`
- `src/views/DynamicProjectView.tsx`
- `src/data/agentDetails.ts`
- `src/runtime-schema/` (entire directory)
- `src/api/agents.ts`
- `src/api/chat.ts`
- `src/api/views.ts`
- `src/api/index.ts`
- `src/lib/navigate.ts`

---

## Task 1: Install Three.js & Update Project Config

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/index.html`

- [ ] **Step 1: Install three.js**

```bash
cd D:/GitHub/Mars_design1/frontend && npm install three && npm install -D @types/three
```

- [ ] **Step 2: Update index.html — change title and fonts**

Replace the entire `frontend/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>Codon — Synthetic Biology AI Platform</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Verify install**

```bash
cd D:/GitHub/Mars_design1/frontend && npm run lint
```

Expected: no errors (three is installed but not yet imported)

- [ ] **Step 4: Commit**

```bash
cd D:/GitHub/Mars_design1/frontend && git add package.json package-lock.json index.html
git commit -m "chore: install three.js, update fonts and title to Codon"
```

---

## Task 2: Rewrite CSS Design System

**Files:**
- Rewrite: `frontend/src/index.css`

- [ ] **Step 1: Replace index.css with Codon design tokens**

Write the complete new `frontend/src/index.css`:

```css
@import "tailwindcss";

@theme {
  /* ── Codon Design Tokens ── */
  --font-headline: "Instrument Sans", "Noto Sans SC", sans-serif;
  --font-body: "Inter", "Noto Sans SC", sans-serif;
  --font-mono: "JetBrains Mono", "Noto Sans SC", monospace;

  /* Core palette */
  --color-bg: #0F1523;
  --color-surface: #0a0e1a;
  --color-card: rgba(242, 244, 245, 0.04);
  --color-border: rgba(255, 255, 255, 0.06);
  --color-border-hover: rgba(255, 255, 255, 0.12);
  --color-primary: #38bdf8;
  --color-danger: #f43f5e;
  --color-success: #4ade80;
  --color-warning: #fbbf24;
  --color-text: #ffffff;
  --color-text-muted: rgba(255, 255, 255, 0.45);
  --color-text-dim: rgba(255, 255, 255, 0.25);
}

/* ── Base Styles ── */
html {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  min-height: 100vh;
}

/* ── Scrollbar ── */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* ── Selection ── */
::selection {
  background: rgba(56, 189, 248, 0.3);
  color: #fff;
}
```

- [ ] **Step 2: Verify Tailwind picks up the new tokens**

```bash
cd D:/GitHub/Mars_design1/frontend && npm run lint
```

Expected: PASS (no type errors)

- [ ] **Step 3: Commit**

```bash
cd D:/GitHub/Mars_design1/frontend && git add src/index.css
git commit -m "feat: rewrite CSS with Codon design tokens"
```

---

## Task 3: Delete Old Components & Views

**Files:**
- Delete: all files listed in "Files to DELETE" section above

- [ ] **Step 1: Delete old component directories and files**

```bash
cd D:/GitHub/Mars_design1/frontend/src

# Delete component subdirectories
rm -rf components/nexus components/orchestrator components/synthesis components/validation components/command components/settings components/diagnostics

# Delete old standalone components
rm -f components/Starfield.tsx components/AmbientGlow.tsx components/TelemetryTicker.tsx
rm -f components/AnalysisCard.tsx components/DesignCard.tsx components/EnvironmentalCard.tsx
rm -f components/MarsStatusGlobe.tsx components/MarsDataGlobe.tsx components/ProceduralMarsGlobe.tsx
rm -f components/DetailPanel.tsx components/FallbackImage.tsx components/AiChatWidget.tsx
rm -f components/Icon.tsx

# Delete old views
rm -f views/Layout.tsx views/OrchestratorView.tsx views/CommandView.tsx
rm -f views/SynthesisView.tsx views/EnvironmentView.tsx views/DynamicProjectView.tsx

# Delete old API modules
rm -f api/agents.ts api/chat.ts api/views.ts api/index.ts

# Delete old data and runtime-schema
rm -rf data runtime-schema

# Delete old lib
rm -f lib/navigate.ts
```

- [ ] **Step 2: Commit deletions**

```bash
cd D:/GitHub/Mars_design1/frontend && git add -A
git commit -m "chore: delete all old Mars components, views, and modules"
```

---

## Task 4: Rewrite Motion Presets

**Files:**
- Rewrite: `frontend/src/lib/motion.ts`

- [ ] **Step 1: Write simplified Codon motion presets**

```typescript
import type { Variants } from "motion/react";

const ease = [0.25, 0.46, 0.45, 0.94] as const;

// Page-level transition
export const viewTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease },
  },
};

// Stagger container
export const stagger = (staggerMs = 50): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: staggerMs / 1000 },
  },
});

// Fade + slide up (list items)
export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease },
  },
};

// Fade in only
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.4, ease },
  },
};

// Card hover — subtle 2px lift
export const cardHover = {
  whileHover: {
    y: -2,
    transition: { duration: 0.2, ease },
  },
};

// Button press
export const buttonPress = {
  whileTap: { scale: 0.97, transition: { duration: 0.1 } },
};

// Viewport trigger defaults
export const inViewport = {
  viewport: { once: true, amount: 0.3 as const },
};
```

- [ ] **Step 2: Commit**

```bash
cd D:/GitHub/Mars_design1/frontend && git add src/lib/motion.ts
git commit -m "feat: rewrite motion presets for Codon (restrained animations)"
```

---

## Task 5: Rewrite i18n Translations

**Files:**
- Modify: `frontend/src/i18n/context.tsx` (update storage key)
- Rewrite: `frontend/src/i18n/locales/zh.ts`
- Rewrite: `frontend/src/i18n/locales/en.ts`

- [ ] **Step 1: Update storage key in context.tsx**

In `frontend/src/i18n/context.tsx`, change line 14:

```typescript
const STORAGE_KEY = 'codon_locale';
```

- [ ] **Step 2: Write zh.ts**

```typescript
const zh = {
  nav: {
    home: "首页",
    projects: "项目",
    designer: "设计器",
    chat: "对话",
    analysis: "分析",
  },
  home: {
    title: "设计生命",
    titleAccent: "序列驱动未来",
    subtitle: "AI 驱动的多智能体合成生物学平台 — 基因回路设计、序列优化与实验验证",
    cta: "开始设计",
    demo: "查看演示",
    stats: {
      agents: "AI Agents",
      sequences: "已设计序列",
      validation: "验证通过率",
    },
  },
  projects: {
    title: "项目",
    subtitle: "管理你的合成生物学项目",
    newProject: "新建项目",
    createProject: "创建项目",
    projectName: "项目名称",
    projectDescription: "项目描述",
    cancel: "取消",
    create: "创建",
    delete: "删除",
    open: "打开",
    confirmDelete: "确认删除此项目？",
    empty: "还没有项目，创建一个开始吧",
    status: {
      active: "活跃",
      draft: "草稿",
      completed: "已完成",
    },
    sequences: "序列",
    updated: "更新于",
  },
  designer: {
    title: "设计器",
    subtitle: "AI Agent 协作设计生物序列与基因回路",
    placeholder: "选择一个项目开始设计，或创建新项目",
    comingSoon: "完整设计器即将推出",
  },
  chat: {
    title: "AI 对话",
    subtitle: "与 AI Agent 协作",
    placeholder: "输入你的问题或指令...",
    send: "发送",
    welcome: "你好！我是 Codon AI 助手，可以帮你设计基因回路、优化序列或分析实验结果。",
  },
  analysis: {
    title: "分析",
    subtitle: "序列验证与实验结果分析",
    placeholder: "分析面板即将推出",
    comingSoon: "完整分析工具即将推出",
  },
  login: {
    createAccount: "创建账户",
    signIn: "登录",
    username: "用户名",
    email: "邮箱",
    password: "密码",
    registering: "注册中...",
    loggingIn: "登录中...",
    register: "注册",
    hasAccount: "已有账户？去登录",
    noAccount: "没有账户？去注册",
    registerSuccess: "注册成功，正在自动登录...",
    registerSuccessManual: "注册成功，请手动登录。",
    registerFailed: "注册失败",
    loginFailed: "登录失败",
  },
  common: {
    loading: "加载中...",
    error: "出错了",
    retry: "重试",
    save: "保存",
    cancel: "取消",
    confirm: "确认",
    search: "搜索",
    settings: "设置",
    logout: "退出登录",
    language: "语言",
  },
};

export default zh;
```

- [ ] **Step 3: Write en.ts**

```typescript
const en = {
  nav: {
    home: "Home",
    projects: "Projects",
    designer: "Designer",
    chat: "Chat",
    analysis: "Analysis",
  },
  home: {
    title: "Design Life,",
    titleAccent: "Sequence by Sequence",
    subtitle: "AI-powered multi-agent platform for synthetic biology — gene circuit design, sequence optimization, and experimental validation.",
    cta: "Start Designing",
    demo: "View Demo",
    stats: {
      agents: "AI Agents",
      sequences: "Sequences Designed",
      validation: "Validation Rate",
    },
  },
  projects: {
    title: "Projects",
    subtitle: "Manage your synthetic biology projects",
    newProject: "New Project",
    createProject: "Create Project",
    projectName: "Project Name",
    projectDescription: "Description",
    cancel: "Cancel",
    create: "Create",
    delete: "Delete",
    open: "Open",
    confirmDelete: "Are you sure you want to delete this project?",
    empty: "No projects yet. Create one to get started.",
    status: {
      active: "Active",
      draft: "Draft",
      completed: "Completed",
    },
    sequences: "sequences",
    updated: "Updated",
  },
  designer: {
    title: "Designer",
    subtitle: "AI Agent collaborative biological sequence & gene circuit design",
    placeholder: "Select a project to start designing, or create a new one",
    comingSoon: "Full designer coming soon",
  },
  chat: {
    title: "AI Chat",
    subtitle: "Collaborate with AI Agents",
    placeholder: "Type your question or command...",
    send: "Send",
    welcome: "Hello! I'm the Codon AI assistant. I can help you design gene circuits, optimize sequences, or analyze experimental results.",
  },
  analysis: {
    title: "Analysis",
    subtitle: "Sequence validation & experimental results",
    placeholder: "Analysis panel coming soon",
    comingSoon: "Full analysis tools coming soon",
  },
  login: {
    createAccount: "Create Account",
    signIn: "Sign In",
    username: "Username",
    email: "Email",
    password: "Password",
    registering: "Registering...",
    loggingIn: "Signing in...",
    register: "Register",
    hasAccount: "Already have an account? Sign in",
    noAccount: "No account? Register",
    registerSuccess: "Registration succeeded. Signing in...",
    registerSuccessManual: "Registration succeeded. Please sign in manually.",
    registerFailed: "Registration failed",
    loginFailed: "Sign in failed",
  },
  common: {
    loading: "Loading...",
    error: "Something went wrong",
    retry: "Retry",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    search: "Search",
    settings: "Settings",
    logout: "Sign Out",
    language: "Language",
  },
};

export default en;
```

- [ ] **Step 4: Commit**

```bash
cd D:/GitHub/Mars_design1/frontend && git add src/i18n/
git commit -m "feat: rewrite i18n for Codon with new page structure"
```

---

## Task 6: Build DNA Double-Helix Particle Component

**Files:**
- Create: `frontend/src/components/DnaParticles.tsx`

- [ ] **Step 1: Create the Three.js DNA particle component**

```typescript
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface DnaParticlesProps {
  opacity?: number;
  particleCount?: number;
  className?: string;
}

export default function DnaParticles({
  opacity = 0.15,
  particleCount = 3000,
  className = "",
}: DnaParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // DNA helix parameters
    const radius = 4;
    const pitch = 0.6;
    const turns = 8;
    const pointsPerStrand = Math.floor(particleCount / 2);
    const totalAngle = turns * Math.PI * 2;

    // Create particle positions
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    const primaryColor = new THREE.Color("#38bdf8");
    const secondaryColor = new THREE.Color("#1e3a5f");
    const rungColor = new THREE.Color("#1a2d45");

    for (let i = 0; i < pointsPerStrand; i++) {
      const t = i / pointsPerStrand;
      const angle = t * totalAngle;
      const y = (t - 0.5) * turns * pitch * 10;

      // Add slight noise to radius for organic feel
      const noiseR = radius + (Math.random() - 0.5) * 0.8;

      // Strand A
      const idxA = i * 3;
      positions[idxA] = noiseR * Math.cos(angle);
      positions[idxA + 1] = y;
      positions[idxA + 2] = noiseR * Math.sin(angle);

      const colorA = Math.random() > 0.3 ? primaryColor : secondaryColor;
      colors[idxA] = colorA.r;
      colors[idxA + 1] = colorA.g;
      colors[idxA + 2] = colorA.b;

      sizes[i] = 1.5 + Math.random() * 2.0;
      phases[i] = Math.random() * Math.PI * 2;

      // Strand B (phase offset π)
      const idxB = (pointsPerStrand + i) * 3;
      positions[idxB] = noiseR * Math.cos(angle + Math.PI);
      positions[idxB + 1] = y;
      positions[idxB + 2] = noiseR * Math.sin(angle + Math.PI);

      const colorB = Math.random() > 0.5 ? primaryColor : secondaryColor;
      colors[idxB] = colorB.r;
      colors[idxB + 1] = colorB.g;
      colors[idxB + 2] = colorB.b;

      sizes[pointsPerStrand + i] = 1.5 + Math.random() * 2.0;
      phases[pointsPerStrand + i] = Math.random() * Math.PI * 2;
    }

    // Points geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Custom shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: opacity },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;

        void main() {
          vColor = color;
          vec3 pos = position;

          // Breathing: subtle radius oscillation
          float breathe = sin(uTime * 0.5 + pos.y * 0.3) * 0.15;
          pos.x *= 1.0 + breathe;
          pos.z *= 1.0 + breathe;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * uPixelRatio * (8.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          // Distance-based alpha
          float dist = length(pos.xz);
          vAlpha = smoothstep(8.0, 2.0, dist);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uOpacity;

        void main() {
          // Soft circle
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, d) * vAlpha * uOpacity;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Base-pair rungs (LineSegments connecting strands)
    const rungCount = Math.floor(turns * 10);
    const rungPositions = new Float32Array(rungCount * 6);
    for (let i = 0; i < rungCount; i++) {
      const t = i / rungCount;
      const angle = t * totalAngle;
      const y = (t - 0.5) * turns * pitch * 10;

      rungPositions[i * 6] = radius * Math.cos(angle);
      rungPositions[i * 6 + 1] = y;
      rungPositions[i * 6 + 2] = radius * Math.sin(angle);
      rungPositions[i * 6 + 3] = radius * Math.cos(angle + Math.PI);
      rungPositions[i * 6 + 4] = y;
      rungPositions[i * 6 + 5] = radius * Math.sin(angle + Math.PI);
    }

    const rungGeometry = new THREE.BufferGeometry();
    rungGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(rungPositions, 3)
    );
    const rungMaterial = new THREE.LineBasicMaterial({
      color: rungColor,
      transparent: true,
      opacity: opacity * 0.4,
      blending: THREE.AdditiveBlending,
    });
    const rungs = new THREE.LineSegments(rungGeometry, rungMaterial);
    scene.add(rungs);

    // Mouse parallax
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Scroll response
    let scrollY = 0;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Update uniforms
      material.uniforms.uTime.value = elapsed;

      // Slow rotation
      points.rotation.y = elapsed * 0.08;
      rungs.rotation.y = elapsed * 0.08;

      // Scroll-driven pitch change
      const scrollFactor = scrollY * 0.0003;
      points.rotation.x = scrollFactor * 0.5;
      rungs.rotation.x = scrollFactor * 0.5;

      // Mouse parallax on camera
      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 1.0 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      geometry.dispose();
      material.dispose();
      rungGeometry.dispose();
      rungMaterial.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [opacity, particleCount]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd D:/GitHub/Mars_design1/frontend && npm run lint
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
cd D:/GitHub/Mars_design1/frontend && git add src/components/DnaParticles.tsx
git commit -m "feat: add Three.js DNA double-helix particle background component"
```

---

## Task 7: Build Shared UI Components

**Files:**
- Create: `frontend/src/components/Badge.tsx`
- Create: `frontend/src/components/Avatar.tsx`
- Create: `frontend/src/components/ProjectCard.tsx`
- Create: `frontend/src/components/ChatMessage.tsx`
- Rewrite: `frontend/src/components/index.ts`

- [ ] **Step 1: Write Badge.tsx**

```typescript
interface BadgeProps {
  variant?: "active" | "progress" | "draft" | "default";
  children: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  active: "bg-success/10 text-success border-success/20",
  progress: "bg-primary/10 text-primary border-primary/20",
  draft: "bg-text-dim/10 text-text-muted border-border",
  default: "bg-card text-text-muted border-border",
};

export default function Badge({ variant = "default", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded border ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
```

- [ ] **Step 2: Write Avatar.tsx**

```typescript
interface AvatarProps {
  name?: string;
  src?: string;
  size?: number;
  className?: string;
}

export default function Avatar({ name = "", src, size = 32, className = "" }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-primary/15 text-primary font-medium ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials || "?"}
    </div>
  );
}
```

- [ ] **Step 3: Write ProjectCard.tsx**

```typescript
import { motion } from "motion/react";
import { Trash2, ExternalLink } from "lucide-react";
import Badge from "./Badge";
import { cardHover } from "../lib/motion";
import type { Project } from "../api/projects";

interface ProjectCardProps {
  project: Project;
  onOpen: (id: number) => void;
  onDelete: (id: number) => void;
  t: (key: string) => string;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "active": return "active" as const;
    case "in_progress": return "progress" as const;
    case "completed": return "active" as const;
    default: return "draft" as const;
  }
};

export default function ProjectCard({ project, onOpen, onDelete, t }: ProjectCardProps) {
  const timeAgo = project.updated_at
    ? new Date(project.updated_at).toLocaleDateString()
    : new Date(project.created_at).toLocaleDateString();

  return (
    <motion.div
      {...cardHover}
      className="bg-card border border-border rounded-xl p-4 hover:border-border-hover transition-colors cursor-pointer"
      onClick={() => onOpen(project.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-text truncate pr-2">
          {project.name}
        </h3>
        <Badge variant={statusVariant(project.status)}>
          {t(`projects.status.${project.status === "in_progress" ? "active" : project.status || "draft"}`)}
        </Badge>
      </div>

      {project.description && (
        <p className="text-xs text-text-muted line-clamp-2 mb-3 leading-relaxed">
          {project.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-dim">
          {t("projects.updated")} {timeAgo}
        </span>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project.id);
            }}
            className="p-1.5 rounded-md hover:bg-danger/10 text-text-dim hover:text-danger transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(project.id);
            }}
            className="p-1.5 rounded-md hover:bg-primary/10 text-text-dim hover:text-primary transition-colors"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 4: Write ChatMessage.tsx**

```typescript
import Avatar from "./Avatar";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  agentName?: string;
}

export default function ChatMessage({ role, content, agentName }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar
        name={isUser ? "You" : agentName || "Codon AI"}
        size={28}
        className="flex-shrink-0 mt-1"
      />
      <div
        className={`max-w-[70%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary/10 text-text border border-primary/20"
            : "bg-card text-text-muted border border-border"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write barrel exports index.ts**

```typescript
export { default as DnaParticles } from "./DnaParticles";
export { default as Badge } from "./Badge";
export { default as Avatar } from "./Avatar";
export { default as ProjectCard } from "./ProjectCard";
export { default as ChatMessage } from "./ChatMessage";
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd D:/GitHub/Mars_design1/frontend && npm run lint
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
cd D:/GitHub/Mars_design1/frontend && git add src/components/
git commit -m "feat: add Codon UI components (Badge, Avatar, ProjectCard, ChatMessage)"
```

---

## Task 8: Build TopNav Component

**Files:**
- Create: `frontend/src/components/TopNav.tsx`

- [ ] **Step 1: Write TopNav.tsx**

```typescript
import { Link, useLocation } from "react-router-dom";
import { Globe } from "lucide-react";
import { useLocale } from "../i18n/context";

const NAV_ITEMS = [
  { path: "/", key: "nav.home" },
  { path: "/projects", key: "nav.projects" },
  { path: "/designer", key: "nav.designer" },
  { path: "/chat", key: "nav.chat" },
  { path: "/analysis", key: "nav.analysis" },
];

export default function TopNav() {
  const { t, locale, setLocale } = useLocale();
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 bg-bg/80 backdrop-blur-sm border-b border-border">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-primary text-lg">◇</span>
        <span className="font-headline font-semibold text-[15px] tracking-wide text-text">
          CODON
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-6">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`text-[13px] transition-colors relative py-1 ${
                isActive
                  ? "text-text"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {t(item.key)}
              {isActive && (
                <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
          className="p-1.5 rounded-md text-text-muted hover:text-text transition-colors"
        >
          <Globe size={16} />
        </button>
        <Link
          to="/projects"
          className="hidden md:block text-xs font-semibold px-4 py-2 bg-primary text-bg rounded-lg hover:bg-primary/90 transition-colors"
        >
          {t("home.cta")}
        </Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Add to barrel exports**

Append to `frontend/src/components/index.ts`:

```typescript
export { default as TopNav } from "./TopNav";
```

- [ ] **Step 3: Commit**

```bash
cd D:/GitHub/Mars_design1/frontend && git add src/components/TopNav.tsx src/components/index.ts
git commit -m "feat: add TopNav horizontal navigation component"
```

---

## Task 9: Build Sidebar Component

**Files:**
- Create: `frontend/src/components/Sidebar.tsx`

- [ ] **Step 1: Write Sidebar.tsx**

```typescript
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  FolderOpen,
  Dna,
  MessageSquare,
  BarChart3,
  Globe,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useState } from "react";
import { useLocale } from "../i18n/context";
import { logout } from "../api/auth";
import Avatar from "./Avatar";

const NAV_ITEMS = [
  { path: "/", icon: Home, key: "nav.home" },
  { path: "/projects", icon: FolderOpen, key: "nav.projects" },
  { path: "/designer", icon: Dna, key: "nav.designer" },
  { path: "/chat", icon: MessageSquare, key: "nav.chat" },
  { path: "/analysis", icon: BarChart3, key: "nav.analysis" },
];

export default function Sidebar() {
  const { t, locale, setLocale } = useLocale();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <aside
      className={`flex flex-col h-screen bg-surface border-r border-border transition-all duration-200 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <span className="text-primary text-lg">◇</span>
            <span className="font-headline font-semibold text-[15px] tracking-wide text-text">
              CODON
            </span>
          </Link>
        )}
        {collapsed && (
          <Link to="/" className="mx-auto text-primary text-lg">
            ◇
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1 rounded-md text-text-dim hover:text-text-muted transition-colors ${
            collapsed ? "mx-auto mt-2" : ""
          }`}
        >
          <ChevronLeft
            size={16}
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {!collapsed && (
          <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-text-dim">
            {t("nav.home") === "首页" ? "导航" : "Navigation"}
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                isActive
                  ? "bg-primary/8 text-primary"
                  : "text-text-muted hover:text-text hover:bg-card"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? t(item.key) : undefined}
            >
              <Icon size={18} strokeWidth={1.5} />
              {!collapsed && t(item.key)}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-3 space-y-1">
        <button
          onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] text-text-muted hover:text-text hover:bg-card transition-colors ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <Globe size={18} strokeWidth={1.5} />
          {!collapsed && (locale === "zh" ? "English" : "中文")}
        </button>
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-[13px] text-text-muted hover:text-danger hover:bg-danger/5 transition-colors ${
            collapsed ? "justify-center px-0" : ""
          }`}
        >
          <LogOut size={18} strokeWidth={1.5} />
          {!collapsed && t("common.logout")}
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Add to barrel exports**

Append to `frontend/src/components/index.ts`:

```typescript
export { default as Sidebar } from "./Sidebar";
```

- [ ] **Step 3: Commit**

```bash
cd D:/GitHub/Mars_design1/frontend && git add src/components/Sidebar.tsx src/components/index.ts
git commit -m "feat: add Sidebar collapsible navigation component"
```

---

## Task 10: Build Layout Components

**Files:**
- Create: `frontend/src/views/HomeLayout.tsx`
- Create: `frontend/src/views/AppLayout.tsx`

- [ ] **Step 1: Write HomeLayout.tsx**

```typescript
import { Outlet } from "react-router-dom";
import { TopNav, DnaParticles } from "../components";

export default function HomeLayout() {
  return (
    <div className="min-h-screen bg-bg">
      <DnaParticles opacity={0.18} particleCount={3000} />
      <TopNav />
      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Write AppLayout.tsx**

```typescript
import { Outlet } from "react-router-dom";
import { Sidebar, DnaParticles } from "../components";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-bg">
      <DnaParticles opacity={0.05} particleCount={1500} />
      <Sidebar />
      <main className="flex-1 relative z-10 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd D:/GitHub/Mars_design1/frontend && git add src/views/HomeLayout.tsx src/views/AppLayout.tsx
git commit -m "feat: add HomeLayout and AppLayout with DNA particle backgrounds"
```

---

## Task 11: Build All Views

**Files:**
- Create: `frontend/src/views/HomeView.tsx`
- Rewrite: `frontend/src/views/LoginView.tsx`
- Rewrite: `frontend/src/views/ProjectsView.tsx`
- Create: `frontend/src/views/DesignerView.tsx`
- Create: `frontend/src/views/ChatView.tsx`
- Create: `frontend/src/views/AnalysisView.tsx`

- [ ] **Step 1: Write HomeView.tsx**

```typescript
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { useLocale } from "../i18n/context";
import { viewTransition, fadeSlideUp, stagger } from "../lib/motion";

export default function HomeView() {
  const { t } = useLocale();

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen flex flex-col"
    >
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-6 pt-14">
        <div className="text-center max-w-2xl">
          <motion.h1
            variants={fadeSlideUp}
            initial="hidden"
            animate="show"
            className="font-headline text-5xl md:text-7xl font-medium tracking-tight text-text leading-[1.1]"
          >
            {t("home.title")}
            <br />
            <span className="text-primary">{t("home.titleAccent")}</span>
          </motion.h1>

          <motion.p
            variants={fadeSlideUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.15 }}
            className="mt-6 text-text-muted text-lg leading-relaxed max-w-xl mx-auto"
          >
            {t("home.subtitle")}
          </motion.p>

          <motion.div
            variants={fadeSlideUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.3 }}
            className="mt-10 flex gap-3 justify-center"
          >
            <Link
              to="/projects"
              className="px-6 py-3 bg-primary text-bg rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              {t("home.cta")}
            </Link>
            <button className="px-6 py-3 border border-border text-text-muted rounded-lg text-sm hover:border-border-hover hover:text-text transition-colors">
              {t("home.demo")}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Stats bar */}
      <motion.div
        variants={stagger(100)}
        initial="hidden"
        animate="show"
        className="flex justify-center gap-12 md:gap-16 py-8 border-t border-border"
      >
        {[
          { value: "5", label: t("home.stats.agents") },
          { value: "1,247", label: t("home.stats.sequences") },
          { value: "94.2%", label: t("home.stats.validation") },
        ].map((stat) => (
          <motion.div key={stat.label} variants={fadeSlideUp} className="text-center">
            <div className="text-2xl md:text-3xl font-medium text-text font-headline">
              {stat.value}
            </div>
            <div className="text-xs text-text-dim mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Rewrite LoginView.tsx**

```typescript
import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import { login, register } from "../api/auth";
import { DnaParticles } from "../components";
import { useLocale } from "../i18n/context";

const INPUT_CLASS =
  "w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg text-text placeholder:text-text-dim focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-sm";

type ApiDetailItem = { msg?: string };

const getErrorMessage = (detail: unknown, fallback: string) => {
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (typeof item === "object" && item ? (item as ApiDetailItem).msg : ""))
      .filter(Boolean);
    if (messages.length > 0) return messages.join("; ");
  }
  if (typeof detail === "string" && detail.trim()) return detail;
  return fallback;
};

export default function LoginView() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = new URLSearchParams(location.search).get("redirect") || "/projects";
  const { t } = useLocale();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        await register({ email, username, password });
        setSuccess(t("login.registerSuccess"));
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          await login(email, password);
        } catch (loginError: any) {
          setError(getErrorMessage(loginError.response?.data?.detail, t("login.registerSuccessManual")));
          setIsRegister(false);
          return;
        }
      } else {
        await login(email, password);
      }
      navigate(redirectTo);
    } catch (err: any) {
      setError(getErrorMessage(err.response?.data?.detail, isRegister ? t("login.registerFailed") : t("login.loginFailed")));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 relative overflow-hidden">
      <DnaParticles opacity={0.08} particleCount={1000} />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-primary text-3xl mb-3">◇</div>
          <h1 className="text-2xl font-headline font-semibold tracking-wide text-text">
            CODON
          </h1>
          <p className="text-sm text-text-muted mt-2">
            {isRegister ? t("login.createAccount") : t("login.signIn")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">
                {t("login.username")}
              </label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
                <input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              {t("login.email")}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">
              {t("login.password")}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
              <p className="text-danger text-xs">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
              <p className="text-success text-xs">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
              loading
                ? "bg-card text-text-muted cursor-not-allowed"
                : "bg-primary text-bg hover:bg-primary/90"
            }`}
          >
            {loading
              ? isRegister ? t("login.registering") : t("login.loggingIn")
              : isRegister ? t("login.register") : t("login.signIn")}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => { setIsRegister(!isRegister); setError(""); setSuccess(""); }}
              className="text-xs text-text-muted hover:text-primary transition-colors"
            >
              {isRegister ? t("login.hasAccount") : t("login.noAccount")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write ProjectsView.tsx**

```typescript
import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Plus, X } from "lucide-react";
import { useLocale } from "../i18n/context";
import { getProjects, createProject, deleteProject, type Project } from "../api/projects";
import { ProjectCard } from "../components";
import { viewTransition, stagger, fadeSlideUp } from "../lib/motion";

export default function ProjectsView() {
  const { t } = useLocale();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch {
      // API not available — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createProject({ name: name.trim(), description: description.trim() || undefined });
      setName("");
      setDescription("");
      setShowCreate(false);
      await fetchProjects();
    } catch {
      // handle error
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("projects.confirmDelete"))) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // handle error
    }
  };

  const handleOpen = (id: number) => {
    localStorage.setItem("active_project_id", String(id));
    // Navigate to designer with project context
    window.location.href = "/designer";
  };

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-6 md:p-8 max-w-5xl"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-headline font-medium text-text tracking-tight">
            {t("projects.title")}
          </h1>
          <p className="text-sm text-text-muted mt-1">{t("projects.subtitle")}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-bg rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          {t("projects.newProject")}
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-headline font-medium text-text">
                {t("projects.createProject")}
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-text-dim hover:text-text">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted mb-1">{t("projects.projectName")}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">{t("projects.projectDescription")}</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary/50 resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-text-muted hover:text-text transition-colors"
                >
                  {t("projects.cancel")}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || creating}
                  className="px-4 py-2 bg-primary text-bg rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {creating ? t("common.loading") : t("projects.create")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project grid */}
      {loading ? (
        <div className="text-center py-20 text-text-muted text-sm">{t("common.loading")}</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-text-muted text-sm">{t("projects.empty")}</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 border border-border text-text-muted rounded-lg text-sm hover:border-border-hover hover:text-text transition-colors"
          >
            <Plus size={14} className="inline mr-1" />
            {t("projects.newProject")}
          </button>
        </div>
      ) : (
        <motion.div
          variants={stagger(60)}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {projects.map((project) => (
            <motion.div key={project.id} variants={fadeSlideUp}>
              <ProjectCard
                project={project}
                onOpen={handleOpen}
                onDelete={handleDelete}
                t={t}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
```

- [ ] **Step 4: Write DesignerView.tsx (placeholder)**

```typescript
import { motion } from "motion/react";
import { Dna } from "lucide-react";
import { useLocale } from "../i18n/context";
import { viewTransition } from "../lib/motion";

export default function DesignerView() {
  const { t } = useLocale();

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-6 md:p-8"
    >
      <h1 className="text-xl font-headline font-medium text-text tracking-tight">
        {t("designer.title")}
      </h1>
      <p className="text-sm text-text-muted mt-1">{t("designer.subtitle")}</p>

      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <Dna size={28} className="text-primary" />
        </div>
        <p className="text-text-muted text-sm">{t("designer.placeholder")}</p>
        <p className="text-text-dim text-xs mt-2">{t("designer.comingSoon")}</p>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 5: Write ChatView.tsx**

```typescript
import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Send } from "lucide-react";
import { useLocale } from "../i18n/context";
import { ChatMessage } from "../components";
import { viewTransition } from "../lib/motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatView() {
  const { t } = useLocale();
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: t("chat.welcome") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Simulated response (backend not connected yet)
    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "This is a placeholder response. The AI backend will be connected in a future update.",
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
    }, 1000);
  };

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col h-screen"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-lg font-headline font-medium text-text tracking-tight">
          {t("chat.title")}
        </h1>
        <p className="text-xs text-text-muted mt-0.5">{t("chat.subtitle")}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-xs">◇</span>
            </div>
            <div className="bg-card border border-border rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-text-dim animate-pulse" />
                <div className="w-1.5 h-1.5 rounded-full bg-text-dim animate-pulse [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-text-dim animate-pulse [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border">
        <div className="flex gap-2 max-w-3xl">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t("chat.placeholder")}
            rows={1}
            className="flex-1 px-4 py-3 bg-card border border-border rounded-lg text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-primary/50 resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-3 bg-primary text-bg rounded-lg hover:bg-primary/90 disabled:opacity-30 transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 6: Write AnalysisView.tsx (placeholder)**

```typescript
import { motion } from "motion/react";
import { BarChart3 } from "lucide-react";
import { useLocale } from "../i18n/context";
import { viewTransition } from "../lib/motion";

export default function AnalysisView() {
  const { t } = useLocale();

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="p-6 md:p-8"
    >
      <h1 className="text-xl font-headline font-medium text-text tracking-tight">
        {t("analysis.title")}
      </h1>
      <p className="text-sm text-text-muted mt-1">{t("analysis.subtitle")}</p>

      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
          <BarChart3 size={28} className="text-primary" />
        </div>
        <p className="text-text-muted text-sm">{t("analysis.placeholder")}</p>
        <p className="text-text-dim text-xs mt-2">{t("analysis.comingSoon")}</p>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd D:/GitHub/Mars_design1/frontend && npm run lint
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
cd D:/GitHub/Mars_design1/frontend && git add src/views/
git commit -m "feat: add all Codon views (Home, Login, Projects, Designer, Chat, Analysis)"
```

---

## Task 12: Rewrite App Router

**Files:**
- Rewrite: `frontend/src/App.tsx`

- [ ] **Step 1: Write new App.tsx**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./ErrorBoundary";
import HomeLayout from "./views/HomeLayout";
import AppLayout from "./views/AppLayout";
import HomeView from "./views/HomeView";
import LoginView from "./views/LoginView";
import ProjectsView from "./views/ProjectsView";
import DesignerView from "./views/DesignerView";
import ChatView from "./views/ChatView";
import AnalysisView from "./views/AnalysisView";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginView />} />

          {/* Home — top nav, fullscreen immersive */}
          <Route element={<HomeLayout />}>
            <Route index element={<HomeView />} />
          </Route>

          {/* App — sidebar layout */}
          <Route element={<AppLayout />}>
            <Route path="projects" element={<ProjectsView />} />
            <Route path="designer" element={<DesignerView />} />
            <Route path="chat" element={<ChatView />} />
            <Route path="analysis" element={<AnalysisView />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd D:/GitHub/Mars_design1/frontend && npm run lint
```

Expected: PASS

- [ ] **Step 3: Verify build**

```bash
cd D:/GitHub/Mars_design1/frontend && npm run build
```

Expected: Build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
cd D:/GitHub/Mars_design1/frontend && git add src/App.tsx
git commit -m "feat: rewrite router with HomeLayout and AppLayout for Codon"
```

---

## Task 13: Update CLAUDE.md & Cleanup

**Files:**
- Modify: `D:/GitHub/Mars_design1/CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md to reflect Codon architecture**

Key changes in CLAUDE.md:
- Replace "Martian Biolab" references with "Codon"
- Update route table to new routes: `/`, `/projects`, `/designer`, `/chat`, `/analysis`, `/login`
- Update "视图层" description: "HomeLayout (top nav + fullscreen) and AppLayout (sidebar + main content)"
- Update view registration rule: new views register in either `HomeLayout.tsx` or `AppLayout.tsx`
- Remove references to old components (Starfield, AmbientGlow, NexusSphere, etc.)
- Add Three.js to dependencies note
- Update font references from Space Grotesk/Outfit to Instrument Sans/Inter

- [ ] **Step 2: Run final build check**

```bash
cd D:/GitHub/Mars_design1/frontend && npm run build
```

Expected: Build succeeds

- [ ] **Step 3: Start dev server and visually verify**

```bash
cd D:/GitHub/Mars_design1/frontend && npm run dev
```

Open http://localhost:3000 and verify:
- Home page shows DNA particles + hero text
- Navigation works between all pages
- Sidebar shows on /projects, /designer, /chat, /analysis
- Login page renders correctly
- No console errors

- [ ] **Step 4: Commit**

```bash
cd D:/GitHub/Mars_design1 && git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for Codon architecture"
```

---

## Task 14: Add .superpowers to .gitignore

**Files:**
- Modify: `D:/GitHub/Mars_design1/.gitignore`

- [ ] **Step 1: Add .superpowers/ to .gitignore**

Append to `.gitignore`:

```
# Superpowers brainstorm artifacts
.superpowers/
```

- [ ] **Step 2: Commit**

```bash
cd D:/GitHub/Mars_design1 && git add .gitignore
git commit -m "chore: add .superpowers/ to .gitignore"
```
