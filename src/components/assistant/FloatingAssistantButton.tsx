import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';
import { FloatingAssistant } from './FloatingAssistant';
import { cn } from '@/lib/utils';

export function FloatingAssistantButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg",
          "bg-gradient-to-br from-primary to-accent",
          "hover:scale-105 transition-transform duration-200",
          "animate-pulse-subtle"
        )}
        size="icon"
      >
        <Bot className="w-6 h-6 text-white" />
      </Button>
      
      <FloatingAssistant open={open} onOpenChange={setOpen} />
    </>
  );
}
