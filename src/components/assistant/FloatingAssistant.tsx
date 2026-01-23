import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserContext } from '@/hooks/useUserContext';
import { useSpeech } from '@/hooks/useSpeech';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Bot, 
  X, 
  Mic, 
  MicOff, 
  Send, 
  Phone, 
  PhoneOff,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface PendingAction {
  type: 'task' | 'project' | 'plan';
  data: any;
  description: string;
}

interface FloatingAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FloatingAssistant({ open, onOpenChange }: FloatingAssistantProps) {
  const { user } = useAuth();
  const { getContextSummary } = useUserContext();
  const { isListening, transcript, startListening, stopListening, speak, isSupported } = useSpeech();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCallMode, setIsCallMode] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle transcript from voice
  useEffect(() => {
    if (transcript && isCallMode) {
      setInput(transcript);
    }
  }, [transcript, isCallMode]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Stream chat with AI
  const streamChat = useCallback(async (userMessage: string) => {
    if (!user || !userMessage.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setLoading(true);

    try {
      const context = getContextSummary();
      
      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [...messages, newUserMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          userContext: context,
        },
      });

      if (response.error) throw response.error;

      const reader = response.data.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      const assistantId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              assistantMessage += content;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId ? { ...m, content: assistantMessage } : m
                )
              );
            } catch {}
          }
        }
      }

      // Parse for actions
      parseAndSetPendingAction(assistantMessage);

      // Speak response in call mode
      if (isCallMode && assistantMessage) {
        speak(assistantMessage.substring(0, 500));
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast.error('خطأ في الاتصال');
    }

    setLoading(false);
  }, [user, messages, getContextSummary, isCallMode, speak]);

  // Parse AI response for actions
  const parseAndSetPendingAction = (content: string) => {
    // Check for task creation patterns
    if (content.includes('مهمة جديدة:') || content.includes('سأضيف مهمة')) {
      const taskMatch = content.match(/مهمة[:\s]+(.+?)(?:\n|$)/);
      if (taskMatch) {
        setPendingAction({
          type: 'task',
          data: { title: taskMatch[1].trim() },
          description: `إضافة مهمة: ${taskMatch[1].trim()}`,
        });
      }
    }
    // Check for project creation patterns
    else if (content.includes('مشروع جديد:') || content.includes('سأنشئ مشروع')) {
      const projectMatch = content.match(/مشروع[:\s]+(.+?)(?:\n|$)/);
      if (projectMatch) {
        setPendingAction({
          type: 'project',
          data: { name: projectMatch[1].trim() },
          description: `إنشاء مشروع: ${projectMatch[1].trim()}`,
        });
      }
    }
  };

  // Confirm pending action
  const confirmAction = async () => {
    if (!pendingAction || !user) return;

    try {
      if (pendingAction.type === 'task') {
        const { error } = await supabase.from('tasks').insert({
          user_id: user.id,
          title: pendingAction.data.title,
          priority: 'medium',
          category: 'work',
          status: 'pending',
        });
        if (error) throw error;
        toast.success('تم إضافة المهمة');
      } else if (pendingAction.type === 'project') {
        const { error } = await supabase.from('projects').insert({
          user_id: user.id,
          name: pendingAction.data.name,
          status: 'active',
        });
        if (error) throw error;
        toast.success('تم إنشاء المشروع');
      }
      setPendingAction(null);
    } catch (error) {
      toast.error('خطأ في تنفيذ الإجراء');
    }
  };

  // Toggle call mode
  const toggleCallMode = () => {
    if (isCallMode) {
      setIsCallMode(false);
      stopListening();
    } else {
      setIsCallMode(true);
      if (isSupported) {
        startListening();
      }
    }
  };

  // Handle voice input end
  useEffect(() => {
    if (isCallMode && !isListening && transcript) {
      streamChat(transcript);
    }
  }, [isListening, isCallMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      streamChat(input);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-xl transition-colors",
                isCallMode ? "bg-green-500/20" : "bg-primary/20"
              )}>
                <Bot className={cn(
                  "w-6 h-6",
                  isCallMode ? "text-green-500" : "text-primary"
                )} />
              </div>
              <div>
                <DialogTitle className="text-lg">المساعد الذكي</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {isCallMode ? 'وضع المكالمة نشط' : 'كيف أساعدك؟'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={isCallMode ? "destructive" : "outline"}
                size="icon"
                onClick={toggleCallMode}
                className="rounded-full"
              >
                {isCallMode ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-primary/50 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  مرحباً! أنا مساعدك الذكي.<br />
                  كيف أستطيع مساعدتك اليوم؟
                </p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] px-4 py-2 rounded-2xl",
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-md">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Pending Action Confirmation */}
        {pendingAction && (
          <div className="p-3 border-t bg-accent/10">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm flex-1">{pendingAction.description}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPendingAction(null)}
                >
                  إلغاء
                </Button>
                <Button
                  size="sm"
                  className="btn-gradient"
                  onClick={confirmAction}
                >
                  <CheckCircle2 className="w-4 h-4 ml-1" />
                  تأكيد
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t flex-shrink-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                "rounded-full transition-colors flex-shrink-0",
                isListening && "bg-red-500/20 text-red-500 border-red-500"
              )}
              onClick={() => isListening ? stopListening() : startListening()}
              disabled={!isSupported}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? 'جارٍ الاستماع...' : 'اكتب رسالتك...'}
              className="flex-1 rounded-full"
              disabled={loading}
            />
            
            <Button
              type="submit"
              size="icon"
              className="rounded-full btn-gradient flex-shrink-0"
              disabled={loading || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
