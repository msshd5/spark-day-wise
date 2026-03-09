import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Upload, Loader2, FileSpreadsheet } from 'lucide-react';

interface ExcelImportExportProps {
  expenses: any[];
  recurringExpenses: any[];
  budget: any;
  onDataChanged: () => void;
}

export function ExcelImportExport({ expenses, recurringExpenses, budget, onDataChanged }: ExcelImportExportProps) {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToCSV = () => {
    try {
      // BOM for Arabic support in Excel
      let csv = '\uFEFF';
      
      // Budget
      csv += 'الميزانية الشهرية\n';
      csv += `المبلغ,${budget?.total_budget || 0}\n\n`;

      // Expenses
      csv += 'المصروفات اليومية\n';
      csv += 'العنوان,المبلغ,التصنيف,التاريخ,ملاحظات\n';
      expenses.forEach(e => {
        csv += `"${e.title}",${e.amount},"${e.category}","${e.expense_date}","${e.notes || ''}"\n`;
      });

      csv += '\n';

      // Recurring
      csv += 'المصروفات المتكررة\n';
      csv += 'العنوان,المبلغ,التصنيف,التكرار,يوم الشهر,نشط\n';
      recurringExpenses.forEach(e => {
        csv += `"${e.title}",${e.amount},"${e.category}","${e.frequency}",${e.day_of_month},"${e.is_active ? 'نعم' : 'لا'}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `مصروفات_${new Date().toISOString().slice(0, 7)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('تم تصدير البيانات بنجاح');
    } catch (error) {
      toast.error('خطأ في التصدير');
    }
  };

  const importFromCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      
      let section = '';
      const newExpenses: any[] = [];
      
      for (const line of lines) {
        if (line.includes('المصروفات اليومية')) {
          section = 'expenses';
          continue;
        }
        if (line.includes('المصروفات المتكررة')) {
          section = 'recurring';
          continue;
        }
        if (line.includes('الميزانية') || line.startsWith('العنوان') || line.startsWith('المبلغ')) {
          continue;
        }

        if (section === 'expenses') {
          const parts = parseCSVLine(line);
          if (parts.length >= 4 && parts[0] && !isNaN(Number(parts[1]))) {
            newExpenses.push({
              user_id: user.id,
              title: parts[0].replace(/"/g, ''),
              amount: Number(parts[1]),
              category: parts[2]?.replace(/"/g, '') || 'other',
              expense_date: parts[3]?.replace(/"/g, '') || new Date().toISOString().split('T')[0],
              notes: parts[4]?.replace(/"/g, '') || null,
            });
          }
        }
      }

      if (newExpenses.length > 0) {
        const { error } = await supabase.from('expenses').insert(newExpenses);
        if (error) throw error;
        toast.success(`تم استيراد ${newExpenses.length} مصروف بنجاح`);
        onDataChanged();
      } else {
        toast.info('لم يتم العثور على بيانات صالحة للاستيراد');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('خطأ في استيراد الملف');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportToCSV}
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        تصدير
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="gap-2"
      >
        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        استيراد
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        onChange={importFromCSV}
        className="hidden"
      />
    </div>
  );
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
