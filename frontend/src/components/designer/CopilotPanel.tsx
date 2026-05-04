import { useMemo } from "react";
import type { FormEvent } from "react";
import { Bot, CornerDownLeft, Lightbulb, Send, Sparkles, User } from "lucide-react";
import CopilotActionCard from "./CopilotActionCard";
import type { CopilotAction } from "./CopilotActionCard";

export type CopilotMessageRole = "assistant" | "user" | "system";

export interface CopilotMessage {
  id: string;
  role: CopilotMessageRole;
  content: string;
  actions?: CopilotAction[];
}

export interface CopilotPanelProps {
  messages: CopilotMessage[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmitPrompt: (prompt: string) => void;
  applyAction: (action: CopilotAction) => void;
  suggestedPrompts?: string[];
  isThinking?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const DEFAULT_PROMPTS = [
  "帮我把环境设定成高辐射、低温、低水活度",
  "推荐一个适合固氮造土的设计路径",
  "解释当前候选底盘的主要风险",
];

const ROLE_STYLE: Record<
  CopilotMessageRole,
  {
    icon: typeof Bot;
    label: string;
    bubble: string;
    avatar: string;
  }
> = {
  assistant: {
    icon: Bot,
    label: "Copilot",
    bubble: "border-white/15 bg-card-translucent text-text",
    avatar: "border-primary/30 bg-primary/10 text-primary",
  },
  user: {
    icon: User,
    label: "You",
    bubble: "border-primary/25 bg-primary/10 text-text",
    avatar: "border-white/15 bg-white/[0.06] text-text-muted",
  },
  system: {
    icon: Sparkles,
    label: "System",
    bubble: "border-amber-400/20 bg-amber-500/10 text-amber-100",
    avatar: "border-amber-400/25 bg-amber-500/10 text-amber-200",
  },
};

export default function CopilotPanel({
  messages,
  inputValue,
  onInputChange,
  onSubmitPrompt,
  applyAction,
  suggestedPrompts = DEFAULT_PROMPTS,
  isThinking = false,
  disabled = false,
  placeholder = "描述你想要的生物设计目标...",
  className = "",
}: CopilotPanelProps) {
  const canSubmit = inputValue.trim().length > 0 && !disabled;
  const prompts = useMemo(
    () => suggestedPrompts.filter((prompt) => prompt.trim().length > 0).slice(0, 4),
    [suggestedPrompts],
  );

  const submitPrompt = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || disabled) return;
    onSubmitPrompt(trimmed);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitPrompt(inputValue);
  };

  return (
    <aside
      className={`flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-white/15 bg-surface/85 shadow-2xl shadow-black/20 backdrop-blur-md ${className}`}
    >
      <header className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <Bot size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-text">Designer Copilot</h2>
            <p className="truncate text-sm text-text-dim">用对话推进环境、任务与候选方案</p>
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center">
            <Sparkles size={22} className="mx-auto text-primary" />
            <div className="mt-3 text-base font-semibold text-text">从一个设计目标开始</div>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-muted">
              Copilot 会把自然语言意图转换成可应用的设计动作。
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const style = ROLE_STYLE[message.role];
            const Icon = style.icon;

            return (
              <section key={message.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${style.avatar}`}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-dim">
                      {style.label}
                    </div>
                    <div className={`rounded-xl border px-4 py-3 ${style.bubble}`}>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                </div>

                {message.actions && message.actions.length > 0 ? (
                  <div className="ml-11 space-y-3">
                    {message.actions.map((action, index) => (
                      <div key={`${message.id}-${action.type}-${index}`}>
                        <CopilotActionCard
                          action={action}
                          applyAction={applyAction}
                          disabled={disabled}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })
        )}

        {isThinking ? (
          <div className="ml-11 flex items-center gap-2 text-sm text-text-dim">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            正在整理下一步建议...
          </div>
        ) : null}
      </div>

      {prompts.length > 0 ? (
        <div className="border-t border-white/10 px-5 py-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-dim">
            <Lightbulb size={14} />
            建议 Prompt
          </div>
          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  onInputChange(prompt);
                  submitPrompt(prompt);
                }}
                disabled={disabled}
                className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-left text-sm leading-snug text-text-muted transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
        <label className="sr-only" htmlFor="designer-copilot-input">
          Designer Copilot prompt
        </label>
        <div className="flex items-end gap-3 rounded-xl border border-white/15 bg-white/[0.04] p-2 focus-within:border-primary/40">
          <textarea
            id="designer-copilot-input"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={2}
            className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-relaxed text-text outline-none placeholder:text-text-dim disabled:cursor-not-allowed"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitPrompt(inputValue);
              }
            }}
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary transition-colors hover:border-primary/50 hover:bg-primary/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-text-dim"
            title="发送"
          >
            {canSubmit ? <Send size={18} /> : <CornerDownLeft size={18} />}
          </button>
        </div>
      </form>
    </aside>
  );
}
