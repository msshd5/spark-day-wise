import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Wallet, 
  Plus, 
  TrendingDown, 
  ShoppingCart, 
  Trash2,
  Check,
  Receipt,
  Star,
  Edit2,
  Repeat,
  Target,
} from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Budget {
  id: string;
  month: string;
  total_budget: number;
}

interface CategoryBudget {
  id: string;
  month: string;
  category: string;
  planned_amount: number;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  expense_date: string;
  notes?: string;
}

interface WishlistItem {
  id: string;
  title: string;
  estimated_price?: number;
  priority: string;
  is_purchased: boolean;
  notes?: string;
}

interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  frequency: string;
  day_of_month: number;
  is_active: boolean;
  notes?: string;
}

const expenseCategories = [
  { value: 'food', label: 'طعام', icon: '🍔', color: '#f97316' },
  { value: 'transport', label: 'مواصلات', icon: '🚗', color: '#3b82f6' },
  { value: 'shopping', label: 'تسوق', icon: '🛍️', color: '#ec4899' },
  { value: 'bills', label: 'فواتير', icon: '📄', color: '#eab308' },
  { value: 'entertainment', label: 'ترفيه', icon: '🎮', color: '#8b5cf6' },
  { value: 'health', label: 'صحة', icon: '💊', color: '#10b981' },
  { value: 'education', label: 'تعليم', icon: '📚', color: '#06b6d4' },
  { value: 'rent', label: 'إيجار', icon: '🏠', color: '#64748b' },
  { value: 'subscriptions', label: 'اشتراكات', icon: '📱', color: '#a855f7' },
  { value: 'other', label: 'أخرى', icon: '📦', color: '#6b7280' },
];

const priorityLabels: Record<string, { label: string; color: string }> = {
  high: { label: 'عالية', color: 'bg-destructive text-destructive-foreground' },
  medium: { label: 'متوسطة', color: 'bg-warning text-warning-foreground' },
  low: { label: 'منخفضة', color: 'bg-muted text-muted-foreground' },
};

const frequencyLabels: Record<string, string> = {
  monthly: 'شهرياً',
  weekly: 'أسبوعياً',
  yearly: 'سنوياً',
};

export default function Finance() {
  const { user } = useAuth();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [newBudget, setNewBudget] = useState('');
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showWishlistDialog, setShowWishlistDialog] = useState(false);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [showCategoryBudgetDialog, setShowCategoryBudgetDialog] = useState(false);
  
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    category: 'other',
    notes: '',
  });
  
  const [wishlistForm, setWishlistForm] = useState({
    title: '',
    estimated_price: '',
    priority: 'medium',
    notes: '',
  });

  const [recurringForm, setRecurringForm] = useState({
    title: '',
    amount: '',
    category: 'bills',
    frequency: 'monthly',
    day_of_month: '1',
    notes: '',
  });

  const [categoryBudgetForm, setCategoryBudgetForm] = useState({
    category: 'transport',
    planned_amount: '',
  });

  const currentMonth = startOfMonth(new Date()).toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchBudget(),
      fetchCategoryBudgets(),
      fetchExpenses(),
      fetchWishlist(),
      fetchRecurringExpenses(),
    ]);
    setLoading(false);
  };

  const fetchBudget = async () => {
    const { data } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user!.id)
      .eq('month', currentMonth)
      .maybeSingle();
    
    setBudget(data);
  };

  const fetchCategoryBudgets = async () => {
    const { data } = await supabase
      .from('category_budgets')
      .select('*')
      .eq('user_id', user!.id)
      .eq('month', currentMonth);
    
    setCategoryBudgets(data || []);
  };

  const fetchExpenses = async () => {
    const startOfCurrentMonth = startOfMonth(new Date()).toISOString().split('T')[0];
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user!.id)
      .gte('expense_date', startOfCurrentMonth)
      .order('expense_date', { ascending: false });
    
    setExpenses(data || []);
  };

  const fetchWishlist = async () => {
    const { data } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', user!.id)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false });
    
    setWishlist(data || []);
  };

  const fetchRecurringExpenses = async () => {
    const { data } = await supabase
      .from('recurring_expenses')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    
    setRecurringExpenses(data || []);
  };

  const saveBudget = async () => {
    const amount = parseFloat(newBudget);
    if (isNaN(amount) || amount <= 0) {
      toast.error('أدخل مبلغ صحيح');
      return;
    }

    if (budget) {
      await supabase
        .from('budgets')
        .update({ total_budget: amount })
        .eq('id', budget.id);
    } else {
      await supabase
        .from('budgets')
        .insert({
          user_id: user!.id,
          month: currentMonth,
          total_budget: amount,
        });
    }

    toast.success('تم حفظ الميزانية');
    setShowBudgetDialog(false);
    setNewBudget('');
    fetchBudget();
  };

  const saveCategoryBudget = async () => {
    const amount = parseFloat(categoryBudgetForm.planned_amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('أدخل مبلغ صحيح');
      return;
    }

    const existingBudget = categoryBudgets.find(
      cb => cb.category === categoryBudgetForm.category
    );

    if (existingBudget) {
      await supabase
        .from('category_budgets')
        .update({ planned_amount: amount })
        .eq('id', existingBudget.id);
    } else {
      await supabase
        .from('category_budgets')
        .insert({
          user_id: user!.id,
          month: currentMonth,
          category: categoryBudgetForm.category,
          planned_amount: amount,
        });
    }

    toast.success('تم حفظ ميزانية الفئة');
    setShowCategoryBudgetDialog(false);
    setCategoryBudgetForm({ category: 'transport', planned_amount: '' });
    fetchCategoryBudgets();
  };

  const deleteCategoryBudget = async (id: string) => {
    await supabase.from('category_budgets').delete().eq('id', id);
    toast.success('تم الحذف');
    fetchCategoryBudgets();
  };

  const addExpense = async () => {
    const amount = parseFloat(expenseForm.amount);
    if (!expenseForm.title.trim() || isNaN(amount) || amount <= 0) {
      toast.error('أكمل البيانات المطلوبة');
      return;
    }

    await supabase
      .from('expenses')
      .insert({
        user_id: user!.id,
        title: expenseForm.title,
        amount: amount,
        category: expenseForm.category,
        notes: expenseForm.notes || null,
      });

    toast.success('تمت إضافة المصروف');
    setShowExpenseDialog(false);
    setExpenseForm({ title: '', amount: '', category: 'other', notes: '' });
    fetchExpenses();
  };

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    toast.success('تم الحذف');
    fetchExpenses();
  };

  const addWishlistItem = async () => {
    if (!wishlistForm.title.trim()) {
      toast.error('أدخل اسم العنصر');
      return;
    }

    await supabase
      .from('wishlist')
      .insert({
        user_id: user!.id,
        title: wishlistForm.title,
        estimated_price: wishlistForm.estimated_price ? parseFloat(wishlistForm.estimated_price) : null,
        priority: wishlistForm.priority,
        notes: wishlistForm.notes || null,
      });

    toast.success('تمت الإضافة للقائمة');
    setShowWishlistDialog(false);
    setWishlistForm({ title: '', estimated_price: '', priority: 'medium', notes: '' });
    fetchWishlist();
  };

  const toggleWishlistPurchased = async (item: WishlistItem) => {
    await supabase
      .from('wishlist')
      .update({ 
        is_purchased: !item.is_purchased,
        purchased_at: !item.is_purchased ? new Date().toISOString() : null,
      })
      .eq('id', item.id);

    fetchWishlist();
  };

  const deleteWishlistItem = async (id: string) => {
    await supabase.from('wishlist').delete().eq('id', id);
    toast.success('تم الحذف');
    fetchWishlist();
  };

  const addRecurringExpense = async () => {
    const amount = parseFloat(recurringForm.amount);
    if (!recurringForm.title.trim() || isNaN(amount) || amount <= 0) {
      toast.error('أكمل البيانات المطلوبة');
      return;
    }

    await supabase
      .from('recurring_expenses')
      .insert({
        user_id: user!.id,
        title: recurringForm.title,
        amount: amount,
        category: recurringForm.category,
        frequency: recurringForm.frequency,
        day_of_month: parseInt(recurringForm.day_of_month),
        notes: recurringForm.notes || null,
      });

    toast.success('تمت إضافة المصروف المتكرر');
    setShowRecurringDialog(false);
    setRecurringForm({ title: '', amount: '', category: 'bills', frequency: 'monthly', day_of_month: '1', notes: '' });
    fetchRecurringExpenses();
  };

  const toggleRecurringActive = async (item: RecurringExpense) => {
    await supabase
      .from('recurring_expenses')
      .update({ is_active: !item.is_active })
      .eq('id', item.id);

    fetchRecurringExpenses();
  };

  const deleteRecurringExpense = async (id: string) => {
    await supabase.from('recurring_expenses').delete().eq('id', id);
    toast.success('تم الحذف');
    fetchRecurringExpenses();
  };

  // حسابات الإحصائيات
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const totalRecurring = recurringExpenses
    .filter(r => r.is_active)
    .reduce((sum, exp) => sum + Number(exp.amount), 0);
  const remainingBudget = budget ? Number(budget.total_budget) - totalExpenses - totalRecurring : 0;
  const spentPercentage = budget ? ((totalExpenses + totalRecurring) / Number(budget.total_budget)) * 100 : 0;

  // حساب المخطط vs الفعلي لكل فئة
  const categoryComparison = expenseCategories.map(cat => {
    const catExpenses = expenses.filter(e => e.category === cat.value);
    const catRecurring = recurringExpenses.filter(e => e.category === cat.value && e.is_active);
    const actualAmount = catExpenses.reduce((sum, e) => sum + Number(e.amount), 0) +
                        catRecurring.reduce((sum, e) => sum + Number(e.amount), 0);
    const plannedBudget = categoryBudgets.find(cb => cb.category === cat.value);
    const plannedAmount = plannedBudget ? Number(plannedBudget.planned_amount) : 0;
    
    return {
      ...cat,
      actualAmount,
      plannedAmount,
      budgetId: plannedBudget?.id,
      count: catExpenses.length + catRecurring.length,
      percentage: plannedAmount > 0 ? (actualAmount / plannedAmount) * 100 : 0,
      remaining: plannedAmount - actualAmount,
    };
  });

  // الفئات التي لها ميزانية مخططة
  const categoriesWithBudget = categoryComparison.filter(cat => cat.plannedAmount > 0);
  // الفئات التي فيها صرف فعلي
  const categoriesWithSpending = categoryComparison.filter(cat => cat.actualAmount > 0);

  const getCategoryIcon = (category: string) => {
    return expenseCategories.find(c => c.value === category)?.icon || '📦';
  };

  const getCategoryLabel = (category: string) => {
    return expenseCategories.find(c => c.value === category)?.label || 'أخرى';
  };

  const getCategoryColor = (category: string) => {
    return expenseCategories.find(c => c.value === category)?.color || '#6b7280';
  };

  return (
    <div className="min-h-screen p-4 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">الأمور المالية 💰</h1>
          <p className="text-muted-foreground text-sm">
            {format(new Date(), 'MMMM yyyy', { locale: ar })}
          </p>
        </div>
      </header>

      {/* Budget Overview Card */}
      <Card className="glass-card mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10" />
        <CardContent className="relative p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/20">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الميزانية الشهرية</p>
                <p className="text-2xl font-bold">
                  {budget ? `${Number(budget.total_budget).toLocaleString()} ر.س` : 'غير محددة'}
                </p>
              </div>
            </div>
            <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit2 className="w-4 h-4 ml-1" />
                  تعديل
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background">
                <DialogHeader>
                  <DialogTitle>تحديد الميزانية الشهرية</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    type="number"
                    placeholder="المبلغ بالريال"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                  />
                  <Button onClick={saveBudget} className="w-full btn-gradient">
                    حفظ الميزانية
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {budget && (
            <>
              <Progress 
                value={Math.min(spentPercentage, 100)} 
                className={cn(
                  "h-3",
                  spentPercentage > 90 ? "bg-destructive/20" : "bg-muted"
                )}
              />
              <div className="flex justify-between mt-3 text-sm">
                <div>
                  <span className="text-muted-foreground">صرفت: </span>
                  <span className={cn(
                    "font-bold",
                    spentPercentage > 90 ? "text-destructive" : "text-foreground"
                  )}>
                    {(totalExpenses + totalRecurring).toLocaleString()} ر.س
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">متبقي: </span>
                  <span className={cn(
                    "font-bold",
                    remainingBudget < 0 ? "text-destructive" : "text-success"
                  )}>
                    {remainingBudget.toLocaleString()} ر.س
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* مقارنة المخطط vs الفعلي */}
      {categoriesWithBudget.length > 0 && (
        <Card className="glass-card mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              المخطط vs الفعلي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoriesWithBudget.map((cat) => (
              <div key={cat.value} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </span>
                  <div className="text-left">
                    <span className={cn(
                      "font-bold",
                      cat.percentage > 100 ? "text-destructive" : cat.percentage > 80 ? "text-warning" : "text-success"
                    )}>
                      {cat.actualAmount.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground"> / {cat.plannedAmount.toLocaleString()} ر.س</span>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      cat.percentage > 100 ? "bg-destructive" : cat.percentage > 80 ? "bg-warning" : ""
                    )}
                    style={{ 
                      width: `${Math.min(cat.percentage, 100)}%`,
                      backgroundColor: cat.percentage <= 80 ? cat.color : undefined,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{cat.percentage.toFixed(0)}% مستخدم</span>
                  <span className={cat.remaining < 0 ? "text-destructive" : "text-success"}>
                    {cat.remaining >= 0 ? `متبقي: ${cat.remaining.toLocaleString()}` : `تجاوز: ${Math.abs(cat.remaining).toLocaleString()}`} ر.س
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="budgets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="budgets" className="gap-1 text-xs">
            <Target className="w-4 h-4" />
            الميزانيات
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1 text-xs">
            <Receipt className="w-4 h-4" />
            المصروفات
          </TabsTrigger>
          <TabsTrigger value="recurring" className="gap-1 text-xs">
            <Repeat className="w-4 h-4" />
            المتكررة
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="gap-1 text-xs">
            <Star className="w-4 h-4" />
            الأمنيات
          </TabsTrigger>
        </TabsList>

        {/* Category Budgets Tab */}
        <TabsContent value="budgets" className="space-y-4">
          <Dialog open={showCategoryBudgetDialog} onOpenChange={setShowCategoryBudgetDialog}>
            <DialogTrigger asChild>
              <Button className="w-full btn-gradient">
                <Plus className="w-4 h-4 ml-2" />
                إضافة ميزانية فئة
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background">
              <DialogHeader>
                <DialogTitle>تحديد ميزانية لفئة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Select 
                  value={categoryBudgetForm.category}
                  onValueChange={(v) => setCategoryBudgetForm(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="المبلغ المخطط"
                  value={categoryBudgetForm.planned_amount}
                  onChange={(e) => setCategoryBudgetForm(prev => ({ ...prev, planned_amount: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  مثال: ميزانية المواصلات 800 ر.س - ستتابع كم صرفت منها فعلياً
                </p>
                <Button onClick={saveCategoryBudget} className="w-full btn-gradient">
                  حفظ الميزانية
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {categoryComparison.filter(c => c.plannedAmount > 0 || c.actualAmount > 0).length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">لم تحدد ميزانيات للفئات بعد</p>
                <p className="text-xs text-muted-foreground mt-1">
                  حدد ميزانية لكل فئة لتتابع المخطط vs الفعلي
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {categoryComparison
                .filter(c => c.plannedAmount > 0 || c.actualAmount > 0)
                .sort((a, b) => b.plannedAmount - a.plannedAmount)
                .map((cat) => (
                <Card key={cat.value} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon}</span>
                        <div>
                          <p className="font-medium">{cat.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {cat.count} عملية
                          </p>
                        </div>
                      </div>
                      {cat.budgetId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteCategoryBudget(cat.budgetId!)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">المخطط</p>
                        <p className="font-bold text-primary">
                          {cat.plannedAmount > 0 ? `${cat.plannedAmount.toLocaleString()} ر.س` : '-'}
                        </p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">الفعلي</p>
                        <p className={cn(
                          "font-bold",
                          cat.plannedAmount > 0 && cat.actualAmount > cat.plannedAmount ? "text-destructive" : "text-foreground"
                        )}>
                          {cat.actualAmount.toLocaleString()} ر.س
                        </p>
                      </div>
                    </div>

                    {cat.plannedAmount > 0 && (
                      <>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all",
                              cat.percentage > 100 ? "bg-destructive" : cat.percentage > 80 ? "bg-warning" : ""
                            )}
                            style={{ 
                              width: `${Math.min(cat.percentage, 100)}%`,
                              backgroundColor: cat.percentage <= 80 ? cat.color : undefined,
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-xs">
                          <Badge variant={cat.percentage > 100 ? "destructive" : cat.percentage > 80 ? "secondary" : "outline"}>
                            {cat.percentage.toFixed(0)}%
                          </Badge>
                          <span className={cat.remaining < 0 ? "text-destructive" : "text-success"}>
                            {cat.remaining >= 0 ? `متبقي: ${cat.remaining.toLocaleString()}` : `تجاوز: ${Math.abs(cat.remaining).toLocaleString()}`} ر.س
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
            <DialogTrigger asChild>
              <Button className="w-full btn-gradient">
                <Plus className="w-4 h-4 ml-2" />
                إضافة مصروف
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background">
              <DialogHeader>
                <DialogTitle>إضافة مصروف جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="وصف المصروف"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="المبلغ"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                />
                <Select 
                  value={expenseForm.category}
                  onValueChange={(v) => setExpenseForm(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="ملاحظات (اختياري)"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                />
                <Button onClick={addExpense} className="w-full btn-gradient">
                  إضافة المصروف
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {expenses.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <TrendingDown className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">لا توجد مصروفات هذا الشهر</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <Card key={expense.id} className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCategoryIcon(expense.category)}</span>
                        <div>
                          <p className="font-medium">{expense.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {getCategoryLabel(expense.category)} • {format(new Date(expense.expense_date), 'd MMM', { locale: ar })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-destructive">
                          -{Number(expense.amount).toLocaleString()} ر.س
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteExpense(expense.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Recurring Expenses Tab */}
        <TabsContent value="recurring" className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">
              إجمالي شهري: <span className="font-bold text-foreground">{totalRecurring.toLocaleString()} ر.س</span>
            </div>
          </div>

          <Dialog open={showRecurringDialog} onOpenChange={setShowRecurringDialog}>
            <DialogTrigger asChild>
              <Button className="w-full btn-gradient">
                <Plus className="w-4 h-4 ml-2" />
                إضافة مصروف متكرر
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background">
              <DialogHeader>
                <DialogTitle>إضافة مصروف متكرر</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="الوصف (مثل: إيجار الشقة)"
                  value={recurringForm.title}
                  onChange={(e) => setRecurringForm(prev => ({ ...prev, title: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="المبلغ"
                  value={recurringForm.amount}
                  onChange={(e) => setRecurringForm(prev => ({ ...prev, amount: e.target.value }))}
                />
                <Select 
                  value={recurringForm.category}
                  onValueChange={(v) => setRecurringForm(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={recurringForm.frequency}
                  onValueChange={(v) => setRecurringForm(prev => ({ ...prev, frequency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="monthly">شهرياً</SelectItem>
                    <SelectItem value="weekly">أسبوعياً</SelectItem>
                    <SelectItem value="yearly">سنوياً</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="يوم الشهر (1-28)"
                  min="1"
                  max="28"
                  value={recurringForm.day_of_month}
                  onChange={(e) => setRecurringForm(prev => ({ ...prev, day_of_month: e.target.value }))}
                />
                <Input
                  placeholder="ملاحظات (اختياري)"
                  value={recurringForm.notes}
                  onChange={(e) => setRecurringForm(prev => ({ ...prev, notes: e.target.value }))}
                />
                <Button onClick={addRecurringExpense} className="w-full btn-gradient">
                  إضافة المصروف المتكرر
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {recurringExpenses.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <Repeat className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">لا توجد مصروفات متكررة</p>
                <p className="text-xs text-muted-foreground mt-1">
                  أضف الإيجار، الاشتراكات، والفواتير الثابتة
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recurringExpenses.map((item) => (
                <Card 
                  key={item.id} 
                  className={cn(
                    "glass-card transition-all",
                    !item.is_active && "opacity-50"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {getCategoryLabel(item.category)} • {frequencyLabels[item.frequency]} • يوم {item.day_of_month}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "font-bold",
                          item.is_active ? "text-warning" : "text-muted-foreground"
                        )}>
                          {Number(item.amount).toLocaleString()} ر.س
                        </span>
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={() => toggleRecurringActive(item)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRecurringExpense(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Wishlist Tab */}
        <TabsContent value="wishlist" className="space-y-4">
          <Dialog open={showWishlistDialog} onOpenChange={setShowWishlistDialog}>
            <DialogTrigger asChild>
              <Button className="w-full btn-gradient">
                <Plus className="w-4 h-4 ml-2" />
                إضافة للقائمة
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-background">
              <DialogHeader>
                <DialogTitle>إضافة عنصر للقائمة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="اسم العنصر"
                  value={wishlistForm.title}
                  onChange={(e) => setWishlistForm(prev => ({ ...prev, title: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="السعر التقريبي (اختياري)"
                  value={wishlistForm.estimated_price}
                  onChange={(e) => setWishlistForm(prev => ({ ...prev, estimated_price: e.target.value }))}
                />
                <Select 
                  value={wishlistForm.priority}
                  onValueChange={(v) => setWishlistForm(prev => ({ ...prev, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="high">أولوية عالية</SelectItem>
                    <SelectItem value="medium">أولوية متوسطة</SelectItem>
                    <SelectItem value="low">أولوية منخفضة</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="ملاحظات (اختياري)"
                  value={wishlistForm.notes}
                  onChange={(e) => setWishlistForm(prev => ({ ...prev, notes: e.target.value }))}
                />
                <Button onClick={addWishlistItem} className="w-full btn-gradient">
                  إضافة للقائمة
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {wishlist.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">قائمة الأمنيات فارغة</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {wishlist.map((item) => (
                <Card 
                  key={item.id} 
                  className={cn(
                    "glass-card transition-all",
                    item.is_purchased && "opacity-60"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleWishlistPurchased(item)}
                          className={cn(
                            "rounded-full border-2",
                            item.is_purchased 
                              ? "bg-success text-success-foreground border-success" 
                              : "border-muted-foreground"
                          )}
                        >
                          {item.is_purchased && <Check className="w-4 h-4" />}
                        </Button>
                        <div>
                          <p className={cn(
                            "font-medium",
                            item.is_purchased && "line-through"
                          )}>
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={priorityLabels[item.priority]?.color || ''}>
                              {priorityLabels[item.priority]?.label}
                            </Badge>
                            {item.estimated_price && (
                              <span className="text-xs text-muted-foreground">
                                ~{Number(item.estimated_price).toLocaleString()} ر.س
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteWishlistItem(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}