import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, Loader2, Bot, User, Minimize2 } from "lucide-react";
import { sendChatMessage, type ChatMessage } from "../api/chat";
import { useLocale } from "../i18n/context";
import { useLocation } from "react-router-dom";

const PAGE_CONTEXT: Record<string, { zh: string; en: string }> = {
  "/orchestrator": {
    zh: "用户正在查看多智能体编排页面，可以启动 6 个 Agent 管线（环境解析、极端微生物、基因映射、回路设计、代谢兼容、结构预测）。",
    en: "User is viewing the multi-agent orchestration page with a 6-agent pipeline.",
  },
  "/simulation": {
    zh: "用户正在查看火星环境生存仿真页面，可调节温度、辐射通量、高氯酸盐浓度、CO2 分压等参数，查看 D. radiodurans、Chroococcidiopsis 等菌种的生存率曲线。",
    en: "User is viewing the Martian survival simulation page with environmental parameters.",
  },
  "/output": {
    zh: "用户正在查看设计输出中心，包含 6 层验证报告（环境解析、基因映射、回路设计、代谢兼容、结构预测、核查层），支持 SBOL/GenBank/PDF/JSON 格式导出。",
    en: "User is viewing the design output hub with 6-layer validation and SBOL/GenBank/PDF/JSON export.",
  },
  "/environment": {
    zh: "用户正在查看火星环境数据页面。",
    en: "User is viewing the Mars environment data page.",
  },
  "/synthesis": {
    zh: "用户正在查看生物合成页面。",
    en: "User is viewing the biosynthesis page.",
  },
};

export default function AiChatWidget() {
  const { locale } = useLocale();
  const isZh = locale === "zh";
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, open]);

  const getPageContext = () => {
    const ctx = PAGE_CONTEXT[location.pathname];
    if (!ctx) return undefined;
    return isZh ? ctx.zh : ctx.en;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const reply = await sendChatMessage(text, getPageContext());
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || (isZh ? "请求失败，请重试" : "Request failed");
      setError(msg);
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

  const greeting = isZh
    ? "你好！我是 Martian Biolab AI 助手。我可以帮你解答合成生物学、火星环境适应、Agent 编排等相关问题。"
    : "Hello! I'm the Martian Biolab AI assistant. I can help with synthetic biology, Mars adaptation, agent pipelines, and more.";

  return (
    <>
      {/* 浮动按钮 */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-on-primary shadow-[0_0_24px_rgba(129,207,255,0.45)] flex items-center justify-center"
        aria-label={isZh ? "打开 AI 助手" : "Open AI Assistant"}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle size={22} />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary text-[9px] font-bold flex items-center justify-center text-on-secondary">
            {messages.filter((m) => m.role === "assistant").length}
          </span>
        )}
      </motion.button>

      {/* 聊天面板 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[560px] flex flex-col glass-panel rounded-2xl border border-outline-variant/20 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* 头部 */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/15 bg-surface-container-high/40 shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center">
                <Bot size={15} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-headline font-bold text-on-surface uppercase tracking-tight">Biolab AI</p>
                <p className="text-[9px] text-tertiary font-headline">
                  {isZh ? "合成生物学助手" : "Synthetic Biology Assistant"}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-on-surface-variant/40 hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <Minimize2 size={13} />
              </button>
            </div>

            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {/* 欢迎语 */}
              {messages.length === 0 && (
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={11} className="text-primary" />
                  </div>
                  <div className="bg-surface-container-high rounded-xl rounded-tl-sm px-3 py-2.5 max-w-[260px]">
                    <p className="text-xs text-on-surface font-body leading-relaxed">{greeting}</p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === "user" ? "bg-primary/15 border border-primary/20" : "bg-surface-container-high border border-outline-variant/15"}`}>
                    {msg.role === "user" ? <User size={11} className="text-primary" /> : <Bot size={11} className="text-on-surface-variant" />}
                  </div>
                  <div className={`rounded-xl px-3 py-2.5 max-w-[260px] ${msg.role === "user" ? "bg-primary/15 border border-primary/20 rounded-tr-sm" : "bg-surface-container-high rounded-tl-sm"}`}>
                    <p className="text-xs text-on-surface font-body leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant/15 flex items-center justify-center shrink-0">
                    <Bot size={11} className="text-on-surface-variant" />
                  </div>
                  <div className="bg-surface-container-high rounded-xl rounded-tl-sm px-3 py-2.5">
                    <Loader2 size={13} className="animate-spin text-primary" />
                  </div>
                </div>
              )}

              {error && (
                <p className="text-[10px] text-secondary text-center font-headline">{error}</p>
              )}

              <div ref={bottomRef} />
            </div>

            {/* 输入框 */}
            <div className="border-t border-outline-variant/15 px-3 py-3 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={isZh ? "输入消息... (Enter 发送)" : "Type a message... (Enter to send)"}
                  className="flex-1 bg-surface-container-lowest border border-outline-variant/25 rounded-xl px-3 py-2 text-xs font-body text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/15 resize-none transition-colors max-h-28"
                  style={{ fieldSizing: "content" } as any}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Send size={13} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
