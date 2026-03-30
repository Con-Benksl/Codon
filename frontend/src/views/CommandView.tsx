import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocale } from "../i18n/context";
import { useLocation } from "react-router-dom";
import { sendChatMessage, type ChatMessage } from "../api/chat";
import { viewTransition, glassEntrance } from "../lib/motion";
import Icon from "../components/Icon";
import VoiceWaveform from "../components/command/VoiceWaveform";

const PAGE_CONTEXT: Record<string, { zh: string; en: string }> = {
  "/command": {
    zh: "用户正在使用 Command Matrix 对话界面，可以指挥 AI 协调者执行生物工程任务。",
    en: "User is in the Command Matrix chat interface to direct the AI orchestrator for bio-engineering tasks.",
  },
};

export default function CommandView() {
  const { locale } = useLocale();
  const isZh = locale === "zh";
  const location = useLocation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    inputRef.current?.focus();
  }, [messages]);

  const getPageContext = () => {
    const ctx = PAGE_CONTEXT[location.pathname];
    return ctx ? (isZh ? ctx.zh : ctx.en) : undefined;
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
      const msg = err?.response?.data?.detail || err?.message || (isZh ? "请求失败" : "Request failed");
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
    ? "你好，指挥官。我是 Martian Biolab 中央协调 AI。请下达你的生物工程指令。"
    : "Greetings, Commander. I am the Martian Biolab central coordinating AI. Issue your bio-engineering directives.";

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 min-h-full flex flex-col items-center"
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[700px] flex items-center justify-between mb-6"
      >
        <div>
          <p className="text-[10px] font-mono text-muted tracking-[0.2em] uppercase mb-1">
            {isZh ? "直接接口 · 中央协调 AI" : "Direct Interface · Central Coordinating AI"}
          </p>
          <h1 className="text-3xl lg:text-4xl font-headline font-light tracking-[0.15em] uppercase text-on-surface">
            COMMAND <span className="text-primary font-bold">MATRIX</span>
          </h1>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
          <span className="w-2 h-2 rounded-full bg-primary animate-dot-pulse" />
          <span className="text-[10px] font-mono text-muted tracking-widest uppercase">
            {isZh ? "在线" : "Online"}
          </span>
        </div>
      </motion.header>

      {/* Chat area */}
      <div className="w-full max-w-[700px] flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto space-y-5 pb-6 px-1">
          {/* Welcome message */}
          {messages.length === 0 && (
            <motion.div variants={glassEntrance} initial="hidden" animate="show">
              <div className="glass-panel-ai px-5 py-4 max-w-[600px]">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="smart_toy" size={16} className="text-primary" />
                  <span className="text-[10px] font-mono text-muted tracking-wider uppercase">
                    BIOLAB AI · {isZh ? "中央核心" : "Central Core"}
                  </span>
                </div>
                <p className="text-sm text-on-surface font-body leading-relaxed">{greeting}</p>
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={msg.role === "user" ? "flex justify-end" : ""}
              >
                {msg.role === "assistant" ? (
                  <div className="glass-panel-ai px-5 py-4 max-w-[600px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="smart_toy" size={14} className="text-primary" />
                      <span className="text-[9px] font-mono text-muted tracking-wider uppercase">BIOLAB AI</span>
                    </div>
                    <p className="text-sm text-on-surface font-body leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ) : (
                  <div className="max-w-[500px]">
                    <p className="text-sm text-on-surface font-body leading-relaxed text-right">{msg.content}</p>
                    <p className="text-[9px] font-mono text-muted text-right mt-1 tracking-wider">COMMANDER</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading state */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel-ai px-5 py-4 max-w-[600px]"
            >
              <span className="text-sm font-mono text-primary tracking-wider animate-pulse">
                COMPUTING...
              </span>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-secondary text-center font-mono">{error}</p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Voice waveform */}
        <div className="flex justify-center mb-4">
          <VoiceWaveform />
        </div>

        {/* Input pill */}
        <div className="relative max-w-[600px] mx-auto w-full mb-2">
          {/* Breathing border effect */}
          <div
            className="absolute -inset-[1px] rounded-full opacity-60"
            style={{
              background: "linear-gradient(90deg, rgba(0,229,255,0.3) 0%, rgba(112,0,255,0.2) 50%, rgba(0,229,255,0.3) 100%)",
              backgroundSize: "200% 100%",
              animation: "borderSweep 8s linear infinite",
              filter: "blur(1px)",
            }}
          />
          <div className="relative flex items-center gap-3 h-16 px-5 rounded-full bg-[rgba(0,0,0,0.4)] backdrop-blur-xl border border-[rgba(255,255,255,0.08)]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={isZh ? "输入指令... (Enter 发送)" : "Enter directive... (Enter to send)"}
              className="flex-1 bg-transparent text-sm font-body text-on-surface placeholder:text-muted/40 focus:outline-none resize-none leading-tight py-2"
              style={{ fieldSizing: "content" } as any}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-full bg-primary text-[#001a24] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-[0_0_20px_rgba(0,229,255,0.3)]"
            >
              <Icon name="send" size={18} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
