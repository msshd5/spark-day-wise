import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, User, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
  onSpeak?: (text: string) => void;
  canSpeak?: boolean;
}

export function MessageBubble({ message, onSpeak, canSpeak }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "flex items-start gap-3 animate-fade-in",
      isUser && "flex-row-reverse"
    )}>
      <div className={cn(
        "p-2 rounded-full shrink-0",
        isUser ? "bg-primary/20" : "bg-accent/20"
      )}>
        {isUser ? (
          <User className="w-5 h-5 text-primary" />
        ) : (
          <Bot className="w-5 h-5 text-accent" />
        )}
      </div>

      <div className="flex flex-col gap-1 max-w-[80%]">
        <Card className={cn(
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "glass-card"
        )}>
          <CardContent className="p-3">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {message.content || '...'}
            </p>
          </CardContent>
        </Card>

        {/* زر النطق للرسائل من المساعد */}
        {!isUser && canSpeak && message.content && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSpeak?.(message.content)}
            className="self-start text-muted-foreground hover:text-accent h-7 px-2"
          >
            <Volume2 className="w-3 h-3 ml-1" />
            <span className="text-xs">استمع</span>
          </Button>
        )}
      </div>
    </div>
  );
}
