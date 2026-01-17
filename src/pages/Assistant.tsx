import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Send, 
  Sparkles,
  Bot,
  User,
  Calendar,
  ListTodo,
  Target,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickCommands = [
  { icon: Calendar, label: 'رتّب يومي', command: 'رتّب يومي' },
  { icon: ListTodo, label: 'قسّم المهمة', command: 'قسّم المهمة' },
  { icon: Target, label: 'خطة أسبوع', command: 'سوّي خطة أسبوع' },
  { icon: HelpCircle, label: 'وش الأهم؟', command: 'وش الأهم الآن؟' },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export default function Assistant() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `أهلاً ${profile?.name || 'صديقي'}! 👋\n\nأنا مساعدك الذكي، موجود لمساعدتك في:\n\n• ترتيب يومك وأولوياتك\n• تقسيم المهام الكبيرة\n• إنشاء خطط أسبوعية\n• الإجابة على استفساراتك\n\nكيف أقدر أساعدك اليوم؟`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: string) => {
    // إضافة رسالة المستخدم
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // تحضير المحادثة للإرسال
    const chatHistory = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
    chatHistory.push({ role: 'user', content: userMessage });

    try {
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل الاتصال بالمساعد الذكي');
      }

      if (!response.body) {
        throw new Error('لم يتم استلام رد');
      }

      // معالجة Stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      // إضافة رسالة المساعد الفارغة
      const assistantMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // معالجة كل سطر
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              // تحديث رسالة المساعد
              setMessages(prev => prev.map(m => 
                m.id === assistantMsgId 
                  ? { ...m, content: assistantContent }
                  : m
              ));
            }
          } catch {
            // JSON غير مكتمل، نعيده للـ buffer
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // معالجة ما تبقى في الـ buffer
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => prev.map(m => 
                m.id === assistantMsgId 
                  ? { ...m, content: assistantContent }
                  : m
              ));
            }
          } catch { /* تجاهل */ }
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast.error(error instanceof Error ? error.message : 'حدث خطأ في المحادثة');
      
      // إضافة رسالة خطأ
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال. حاول مرة أخرى. 🔄',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleQuickCommand = (command: string) => {
    if (isLoading) return;
    streamChat(command);
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* الهيدر */}
      <header className="p-4 border-b border-border/50 bg-card/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">المساعد الذكي</h1>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'يفكر...' : 'متصل ونشط'}
            </p>
          </div>
        </div>
      </header>

      {/* منطقة الرسائل */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">جاري الكتابة...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* الأوامر السريعة */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {quickCommands.map((cmd) => (
            <Button
              key={cmd.command}
              variant="outline"
              size="sm"
              onClick={() => handleQuickCommand(cmd.command)}
              className="shrink-0 bg-card border-border hover:bg-primary/10 hover:border-primary/50"
              disabled={isLoading}
            >
              <cmd.icon className="w-4 h-4 ml-2" />
              {cmd.label}
            </Button>
          ))}
        </div>
      </div>

      {/* حقل الإدخال */}
      <div className="p-4 border-t border-border/50 bg-card/50 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 bg-muted border-border"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="btn-gradient shrink-0"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
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

      <Card className={cn(
        "max-w-[80%]",
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
    </div>
  );
}
