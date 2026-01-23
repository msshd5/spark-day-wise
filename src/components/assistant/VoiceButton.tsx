import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceButtonProps {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  onToggleListening: () => void;
  onStopSpeaking: () => void;
  className?: string;
}

export function VoiceButton({
  isListening,
  isSpeaking,
  isSupported,
  onToggleListening,
  onStopSpeaking,
  className,
}: VoiceButtonProps) {
  if (!isSupported) return null;

  if (isSpeaking) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onStopSpeaking}
        className={cn(
          "shrink-0 border-accent text-accent hover:bg-accent/10",
          className
        )}
        title="إيقاف النطق"
      >
        <VolumeX className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={isListening ? "default" : "outline"}
      size="icon"
      onClick={onToggleListening}
      className={cn(
        "shrink-0 transition-all",
        isListening 
          ? "bg-destructive text-destructive-foreground animate-pulse" 
          : "border-primary text-primary hover:bg-primary/10",
        className
      )}
      title={isListening ? "إيقاف الاستماع" : "التحدث"}
    >
      {isListening ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </Button>
  );
}
