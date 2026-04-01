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
