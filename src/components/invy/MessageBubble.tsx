import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  role: "user" | "assistant";
  content: string;
}

export const MessageBubble = ({ role, content }: Props) => {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-primary text-primary-foreground rounded-3xl rounded-br-md px-4 py-2.5 text-[15px] leading-relaxed break-words shadow-sm">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 items-end">
      <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-1">
        <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
      </div>
      <div
        className={cn(
          "max-w-[82%] rounded-3xl rounded-bl-md px-4 py-2.5 text-[15px] leading-relaxed break-words",
          "bg-secondary/70 text-foreground",
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1.5 prose-ol:my-1.5 prose-headings:my-1 prose-strong:text-foreground prose-li:my-0.5">
          <ReactMarkdown>{content || "..."}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
