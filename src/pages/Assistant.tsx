import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // محاكاة رد المساعد (سيتم استبداله بـ AI Gateway)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getSimulatedResponse(content),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
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
            <p className="text-xs text-muted-foreground">متصل ونشط</p>
          </div>
        </div>
      </header>

      {/* منطقة الرسائل */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {isLoading && (
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
              onClick={() => sendMessage(cmd.command)}
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
            <Send className="w-5 h-5" />
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
      "flex items-start gap-3",
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
            {message.content}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function getSimulatedResponse(input: string): string {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('رتب') || lowerInput.includes('يوم')) {
    return `بناءً على مهامك الحالية، هذا ترتيب مقترح ليومك:\n\n🌅 الصباح (8-12):\n• المهام العاجلة والمهمة\n• العمل الذي يحتاج تركيز عالي\n\n☀️ الظهيرة (12-17):\n• الاجتماعات والتواصل\n• المهام المتوسطة\n\n🌙 المساء (17-21):\n• المهام الشخصية والتعلم\n• المراجعة والتخطيط للغد\n\nهل تريد تفاصيل أكثر؟`;
  }

  if (lowerInput.includes('قسم') || lowerInput.includes('مهمة')) {
    return `لتقسيم المهمة بشكل فعال:\n\n1️⃣ حدد الهدف النهائي بوضوح\n2️⃣ قسّمها لخطوات صغيرة (15-30 دقيقة لكل خطوة)\n3️⃣ رتب الخطوات حسب الأولوية\n4️⃣ حدد موعد لكل خطوة\n\nأعطني اسم المهمة وسأساعدك في تقسيمها! 📝`;
  }

  if (lowerInput.includes('خطة') || lowerInput.includes('أسبوع')) {
    return `لإنشاء خطة أسبوعية فعالة:\n\n📋 أولاً: حدد 3 أهداف رئيسية للأسبوع\n📅 ثانياً: وزّع المهام على الأيام\n⚡ ثالثاً: خصص وقت للطوارئ\n🔄 رابعاً: راجع الخطة يومياً\n\nما هي أهدافك الثلاثة الرئيسية لهذا الأسبوع؟`;
  }

  if (lowerInput.includes('أهم') || lowerInput.includes('الآن')) {
    return `للتركيز على الأهم الآن:\n\n❓ اسأل نفسك:\n• ما المهمة التي ستحدث أكبر فرق؟\n• ما الموعد النهائي الأقرب؟\n• ما المهمة التي تؤثر على الآخرين؟\n\n💡 نصيحة: ابدأ بمهمة واحدة فقط وأنهها قبل الانتقال للتالية.\n\nهل تريد مساعدة في تحديد أولوياتك؟`;
  }

  return `شكراً لرسالتك! 😊\n\nأنا هنا لمساعدتك في:\n• ترتيب يومك\n• تقسيم المهام\n• إنشاء خطط\n• الإجابة على استفساراتك\n\nجرّب الأوامر السريعة أدناه أو اكتب ما تحتاجه!`;
}
