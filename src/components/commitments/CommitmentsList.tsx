import { useState } from 'react';
import { useCommitments } from '@/hooks/useCommitments';
import { CommitmentCard } from './CommitmentCard';
import { CommitmentForm } from './CommitmentForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Commitment } from '@/types/database';
import { Plus, CalendarClock, Loader2 } from 'lucide-react';

export function CommitmentsList() {
  const { commitments, loading, addCommitment, updateCommitment, deleteCommitment } = useCommitments();
  const [showForm, setShowForm] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const handleAdd = async (data: Omit<Commitment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setFormLoading(true);
    await addCommitment(data);
    setFormLoading(false);
    setShowForm(false);
  };

  const handleEdit = async (data: Omit<Commitment, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!editingCommitment) return;
    setFormLoading(true);
    await updateCommitment(editingCommitment.id, data);
    setFormLoading(false);
    setEditingCommitment(null);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteCommitment(deletingId);
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-primary" />
          الالتزامات الثابتة
        </h2>
        <Button onClick={() => setShowForm(true)} size="sm" className="btn-gradient">
          <Plus className="w-4 h-4 ml-1" />
          إضافة
        </Button>
      </div>

      {commitments.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            <CalendarClock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد التزامات بعد</p>
            <p className="text-sm">أضف الدوام أو العمل الجزئي أو جلسات الدراسة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {commitments.map(commitment => (
            <CommitmentCard
              key={commitment.id}
              commitment={commitment}
              onEdit={() => setEditingCommitment(commitment)}
              onDelete={() => setDeletingId(commitment.id)}
            />
          ))}
        </div>
      )}

      {/* نموذج الإضافة */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة التزام جديد</DialogTitle>
          </DialogHeader>
          <CommitmentForm
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
            loading={formLoading}
          />
        </DialogContent>
      </Dialog>

      {/* نموذج التعديل */}
      <Dialog open={!!editingCommitment} onOpenChange={() => setEditingCommitment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل الالتزام</DialogTitle>
          </DialogHeader>
          {editingCommitment && (
            <CommitmentForm
              initialData={editingCommitment}
              onSubmit={handleEdit}
              onCancel={() => setEditingCommitment(null)}
              loading={formLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* تأكيد الحذف */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا الالتزام نهائياً ولا يمكن استرجاعه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
