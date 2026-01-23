import { Commitment, commitmentTypeLabels } from '@/types/database';
import { cn } from '@/lib/utils';
import { Briefcase, GraduationCap, Dumbbell, Clock } from 'lucide-react';

interface CommitmentBlockProps {
  commitment: Commitment;
}

const typeIcons = {
  work: Briefcase,
  part_time: Clock,
  study: GraduationCap,
  exercise: Dumbbell,
  other: Clock,
};

export function CommitmentBlock({ commitment }: CommitmentBlockProps) {
  const Icon = typeIcons[commitment.type] || Clock;
  
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border-r-4",
        "bg-opacity-20"
      )}
      style={{ 
        borderRightColor: commitment.color,
        backgroundColor: `${commitment.color}20`
      }}
    >
      <div 
        className="p-2 rounded-lg"
        style={{ backgroundColor: `${commitment.color}30` }}
      >
        <Icon className="w-4 h-4" style={{ color: commitment.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{commitment.title}</p>
        <p className="text-xs text-muted-foreground">
          {commitment.start_time} - {commitment.end_time}
        </p>
      </div>
      <span 
        className="text-xs px-2 py-1 rounded-full"
        style={{ 
          backgroundColor: `${commitment.color}20`,
          color: commitment.color
        }}
      >
        {commitmentTypeLabels[commitment.type]}
      </span>
    </div>
  );
}
