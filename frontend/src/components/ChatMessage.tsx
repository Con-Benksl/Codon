import Avatar from "./Avatar";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  agentName?: string;
}

export default function ChatMessage({ role, content, agentName }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar
        name={isUser ? "You" : agentName || "Codon AI"}
        size={44}
        className="flex-shrink-0 mt-1"
      />
      <div
        className={`max-w-[70%] rounded-2xl px-6 py-4 text-lg leading-relaxed ${
          isUser
            ? "bg-primary/10 text-text border border-primary/30"
            : "bg-card-translucent text-text-muted border border-white/20"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
