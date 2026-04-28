import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Send } from "lucide-react";
import { useLocale } from "../i18n/context";
import { ChatMessage } from "../components";
import { viewTransition } from "../lib/motion";
import { sendChatMessage } from "../api/chat";

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
    setMessages((prev) => {
      if (prev.length === 0) {
        return [{ id: "welcome", role: "assistant", content: t("chat.welcome") }];
      }
      return prev.map((msg) =>
        msg.id === "welcome" ? { ...msg, content: t("chat.welcome") } : msg,
      );
    });
  }, [t]);

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

    try {
      const reply = await sendChatMessage(text);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply || "后端没有返回内容。",
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: unknown) {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          error instanceof Error
            ? `LLM 接口调用失败：${error.message}`
            : "LLM 接口调用失败。",
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={viewTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col h-screen"
    >
      <div className="px-10 py-7 border-b border-white/10">
        <h1 className="text-3xl font-headline font-semibold text-text tracking-tight">
          {t("chat.title")}
        </h1>
        <p className="text-lg text-text-muted mt-2">{t("chat.subtitle")}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id}>
            <ChatMessage role={msg.role} content={msg.content} />
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <span className="text-primary text-base">●</span>
            </div>
            <div className="bg-card-translucent border border-white/20 rounded-2xl px-6 py-4">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-text-dim animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-text-dim animate-pulse [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-text-dim animate-pulse [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-10 py-6 border-t border-white/10">
        <div className="flex gap-3 max-w-4xl">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={t("chat.placeholder")}
            rows={1}
            className="flex-1 px-5 py-4 bg-card border border-white/15 rounded-xl text-lg text-text placeholder:text-text-dim focus:outline-none focus:border-primary/50 resize-none"
          />
          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || loading}
            className="px-6 py-4 bg-primary text-bg rounded-xl hover:bg-primary/90 disabled:opacity-30 transition-colors"
          >
            <Send size={22} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
