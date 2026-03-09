import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MobileNavigation } from './MobileNavigation';
import { AppSidebar } from './AppSidebar';
import { FloatingAssistantButton } from '@/components/assistant/FloatingAssistantButton';
import { useAutoCommitment } from '@/hooks/useAutoCommitment';
import { Loader2, PanelRight } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export function AppLayout() {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  
  // Auto-create work commitment on first use
  useAutoCommitment();

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

  // Mobile layout - no sidebar
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        <main className="safe-bottom">
          <Outlet />
        </main>
        <FloatingAssistantButton />
        <MobileNavigation />
      </div>
    );
  }

  // Desktop layout with sidebar
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with sidebar trigger */}
          <header className="h-14 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                <PanelRight className="h-5 w-5" />
              </SidebarTrigger>
              <h1 className="text-lg font-semibold text-foreground">سبارك</h1>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
