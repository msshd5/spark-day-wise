import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface CategoryBudgetEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: {
    value: string;
    label: string;
    icon: string;
    budgetId?: string;
    plannedAmount: number;
  };
  onSave: (categoryValue: string, amount: number, budgetId?: string) => Promise<void>;
}

export function CategoryBudgetEditDialog({
  open,
  onOpenChange,
  category,
  onSave,
}: CategoryBudgetEditDialogProps) {
  const [amount, setAmount] = useState(category.plannedAmount.toString());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 0) {
      toast.error('أدخل مبلغ صحيح');
      return;
    }

    setSaving(true);
    try {
      await onSave(category.value, numAmount, category.budgetId);
      onOpenChange(false);
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{category.icon}</span>
            تعديل ميزانية {category.label}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              المبلغ المخطط (ر.س)
            </label>
            <Input
              type="number"
              placeholder="أدخل المبلغ"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              dir="ltr"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {category.plannedAmount > 0 
              ? `الميزانية الحالية: ${category.plannedAmount.toLocaleString()} ر.س`
              : 'لم تحدد ميزانية لهذه الفئة بعد'
            }
          </p>
          <Button 
            onClick={handleSave} 
            className="w-full btn-gradient"
            disabled={saving}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ الميزانية'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
