/**
 * RequirementsChat — 嵌入在 OrchestratorView 左侧的 AI 需求对话面板
 * 用户通过对话形式澄清研究目标，AI 主动提问引导，结果作为 Agent 上下文
 */

import React, { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot, User, Send, Loader2, Sparkles, ChevronRight,
  FlaskConical, MapPin, Target, Zap,
} from "lucide-react";
import { sendChatMessage, type ChatMessage } from "../../api/chat";

interface RequirementsSummary {
  location?: string;
  target?: string;
  constraints?: string[];
  organism?: string;
}

interface QuickPrompt {
  icon: React.ElementType;
  labelZh: string;
  labelEn: string;
  promptZh: string;
  promptEn: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    icon: MapPin,
    labelZh: "指定地点",
    labelEn: "Set Location",
    promptZh: "我希望在耶泽罗陨击坑（Jezero Crater）区域开展定植实验",
    promptEn: "I want to conduct colonization experiments in Jezero Crater",
  },
  {
    icon: Target,
    labelZh: "研究目标",
    labelEn: "Set Goal",
    promptZh: "目标是设计可在火星高氯酸盐环境中存活的合成微生物群落",
    promptEn: "Goal is to engineer a synthetic microbial consortium surviving Martian perchlorate",
  },
  {
    icon: FlaskConical,
    labelZh: "选底盘",
    labelEn: "Choose Chassis",
    promptZh: "请推荐合适的底盘微生物，需要耐辐射和耐低温",
    promptEn: "Recommend chassis microbe with radiation and cold tolerance",
  },
  {
    icon: Zap,
    labelZh: "直接启动",
    labelEn: "Quick Start",
    promptZh: "使用默认火星参数快速启动全部 Agent 分析",
    promptEn: "Quick-launch all agents with default Mars parameters",
  },
];

const GREETING_ZH = `你好！我是 **Biolab AI 协调助手**。

在启动 Agent 管线之前，我需要了解你的研究目标。请告诉我：

1. **研究地点** — 在火星哪个区域定植？
2. **目标功能** — 微生物需要完成什么任务？
3. **主要约束** — 有哪些特殊的环境限制？

你可以直接描述，或使用下方快捷提示开始。`;

const GREETING_EN = `Hello! I'm your **Biolab AI Orchestration Assistant**.

Before launching the agent pipeline, I need to understand your research goals. Please tell me:

1. **Research Location** — Which region of Mars?
2. **Target Function** — What tasks should the microbe perform?
3. **Key Constraints** — Any special environmental limits?

You can describe freely or use the quick prompts below.`;

interface Props {
  isZh: boolean;
  onRequirementsUpdate: (summary: RequirementsSummary) => void;
  onConstraintsExtracted: (constraints: string[]) => void;
}

export default function RequirementsChat({ isZh, onRequirementsUpdate, onConstraintsExtracted }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<RequirementsSummary>({});
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const extractConstraintsFromReply = (reply: string): string[] => {
    const constraints: string[] = [];
    const patterns = [
      /高氯酸盐|perchlorate/i,
      /UV|紫外/i,
      /辐射|radiation/i,
      /低温|cold|cryoph/i,
      /CO2|二氧化碳/i,
      /高压|低压|pressure/i,
    ];
    const labels: Record<string, string> = {
      "高氯酸盐|perchlorate": isZh ? "高氯酸盐 (ClO4-)" : "Perchlorate (ClO4-)",
      "UV|紫外": isZh ? "UV-B/C 辐射暴露" : "UV-B/C Exposure",
      "辐射|radiation": isZh ? "宇宙射线辐射" : "GCR Radiation",
      "低温|cold|cryoph": isZh ? "极端低温 (-73°C)" : "Cryogenic Temp (-73°C)",
      "CO2|二氧化碳": isZh ? "95% CO2 大气" : "95% CO2 Atmosphere",
      "高压|低压|pressure": isZh ? "低大气压 (0.6 kPa)" : "Low Pressure (0.6 kPa)",
    };
    patterns.forEach((pat) => {
      const key = pat.source;
      if (pat.test(reply) && labels[key] && !constraints.includes(labels[key])) {
        constraints.push(labels[key]);
      }
    });
    return constraints;
  };

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg: ChatMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setShowQuickPrompts(false);

    const systemContext = isZh
      ? `你是火星合成生物学 Agent 编排系统的 AI 助手。用户正在描述研究需求，你需要：
1. 帮助澄清研究目标、地点、约束条件、候选底盘微生物
2. 主动追问缺失信息
3. 在回复末尾提取关键约束，格式：【约束提取】perchlorate, UV, radiation（英文关键词，逗号分隔）
4. 回复简洁，不超过150字`
      : `You are the AI assistant for a Mars synthetic biology agent orchestration system. As users describe research needs:
1. Help clarify goals, location, constraints, chassis candidates
2. Proactively ask follow-up questions
3. End your reply with: [CONSTRAINTS] perchlorate, UV, radiation (keywords, comma-separated)
4. Keep replies concise, under 150 words`;

    try {
      const reply = await sendChatMessage(msg, systemContext);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      // 提取约束
      const extracted = extractConstraintsFromReply(reply + " " + msg);
      if (extracted.length > 0) {
        onConstraintsExtracted(extracted);
        setSummary((prev) => {
          const next = { ...prev, constraints: [...new Set([...(prev.constraints ?? []), ...extracted])] };
          onRequirementsUpdate(next);
          return next;
        });
      }

      // 简单提取地点信息
      if (/jezero|耶泽罗/i.test(msg)) {
        setSummary((prev) => {
          const next = { ...prev, location: "Jezero Crater" };
          onRequirementsUpdate(next);
          return next;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: isZh ? "抱歉，请求失败，请重试。" : "Request failed, please retry." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const greeting = isZh ? GREETING_ZH : GREETING_EN;

  const renderMessageContent = (content: string) => {
    // 简单 markdown：**bold** 转 <strong>
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i} className="text-on-surface font-headline">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* 头部 */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-outline-variant/15 shrink-0">
        <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center">
          <Bot size={13} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-headline font-bold text-on-surface uppercase tracking-tight">
            {isZh ? "需求对话" : "Requirements Chat"}
          </p>
          <p className="text-[9px] text-primary/60 font-headline">
            {isZh ? "告诉我你的研究目标" : "Describe your research goal"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {Object.keys(summary).length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary/10 border border-tertiary/20"
            >
              <Sparkles size={8} className="text-tertiary" />
              <span className="text-[9px] font-headline text-tertiary uppercase">
                {isZh ? "已提取" : "Captured"}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {/* 欢迎语 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2"
        >
          <div className="w-5 h-5 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
            <Bot size={9} className="text-primary" />
          </div>
          <div className="bg-surface-container-high rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%]">
            <p className="text-[11px] text-on-surface-variant font-body leading-relaxed whitespace-pre-line">
              {renderMessageContent(greeting)}
            </p>
          </div>
        </motion.div>

        {/* 对话消息 */}
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                msg.role === "user"
                  ? "bg-primary/15 border border-primary/20"
                  : "bg-surface-container-high border border-outline-variant/15"
              }`}
            >
              {msg.role === "user" ? (
                <User size={9} className="text-primary" />
              ) : (
                <Bot size={9} className="text-on-surface-variant" />
              )}
            </div>
            <div
              className={`rounded-xl px-3 py-2 max-w-[85%] ${
                msg.role === "user"
                  ? "bg-primary/12 border border-primary/20 rounded-tr-sm"
                  : "bg-surface-container-high rounded-tl-sm"
              }`}
            >
              <p className="text-[11px] text-on-surface font-body leading-relaxed whitespace-pre-wrap">
                {renderMessageContent(msg.content)}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-surface-container-high border border-outline-variant/15 flex items-center justify-center shrink-0">
              <Bot size={9} className="text-on-surface-variant" />
            </div>
            <div className="bg-surface-container-high rounded-xl rounded-tl-sm px-3 py-2">
              <div className="flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary/50"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 快捷提示 */}
      <AnimatePresence>
        {showQuickPrompts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pb-2 grid grid-cols-2 gap-1.5 shrink-0"
          >
            {QUICK_PROMPTS.map((qp, i) => {
              const Icon = qp.icon;
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.07 }}
                  onClick={() => handleSend(isZh ? qp.promptZh : qp.promptEn)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-outline-variant/20 bg-surface-container hover:border-primary/30 hover:bg-primary/5 transition-colors text-left group"
                >
                  <Icon size={10} className="text-primary/50 group-hover:text-primary shrink-0 transition-colors" />
                  <span className="text-[10px] font-headline text-on-surface-variant/70 group-hover:text-on-surface truncate transition-colors">
                    {isZh ? qp.labelZh : qp.labelEn}
                  </span>
                  <ChevronRight size={9} className="text-on-surface-variant/30 group-hover:text-primary/50 shrink-0 ml-auto transition-colors" />
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 输入框 */}
      <div className="border-t border-outline-variant/15 px-3 py-2.5 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={isZh ? "描述你的研究需求..." : "Describe your research goal..."}
            className="flex-1 bg-surface-container-lowest border border-outline-variant/25 rounded-xl px-3 py-2 text-[11px] font-body text-on-surface placeholder:text-on-surface-variant/35 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/15 resize-none transition-colors max-h-20"
            style={{ fieldSizing: "content" } as React.CSSProperties}
          />
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center disabled:opacity-35 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={12} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
