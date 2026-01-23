import { Commitment, commitmentTypeLabels, dayLabels } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Edit2, Trash2 } from 'lucide-react';

interface CommitmentCardProps {
  commitment: Commitment;
  onEdit: () => void;
  onDelete: () => void;
}

export function CommitmentCard({ commitment, onEdit, onDelete }: CommitmentCardProps) {
  return (
    <Card className="glass-card overflow-hidden">
      <div 
        className="h-1" 
        style={{ backgroundColor: commitment.color }}
      />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg">{commitment.title}</h3>
            <Badge variant="outline" className="mt-1">
              {commitmentTypeLabels[commitment.type]}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm">
            {commitment.start_time} - {commitment.end_time}
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {commitment.days.map(day => (
            <Badge 
              key={day} 
              variant="secondary"
              className="text-xs"
              style={{ backgroundColor: `${commitment.color}20`, color: commitment.color }}
            >
              {dayLabels[day]}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
