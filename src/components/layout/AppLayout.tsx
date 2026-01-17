import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MobileNavigation } from './MobileNavigation';
import { Loader2 } from 'lucide-react';

export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* المحتوى الرئيسي */}
      <main className="safe-bottom">
        <Outlet />
      </main>

      {/* شريط التنقل السفلي */}
      <MobileNavigation />
    </div>
  );
}
