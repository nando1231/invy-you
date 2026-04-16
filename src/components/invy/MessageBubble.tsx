import ReactMarkdown from "react-markdown";
import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  role: "user" | "assistant";
  content: string;
}

export const MessageBubble = ({ role, content }: Props) => {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-2 sm:gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser ? "bg-secondary" : "bg-gradient-to-br from-primary to-primary/60",
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-foreground" />
        ) : (
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        )}
      </div>
      <div
        className={cn(
          "rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 max-w-[85%] text-sm break-words",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-secondary text-foreground rounded-tl-sm",
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-headings:my-1">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
