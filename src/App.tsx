import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { useNotifications } from "@/hooks/useNotifications";

// الصفحات
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import Planner from "./pages/Planner";
import Assistant from "./pages/Assistant";
import Settings from "./pages/Settings";
import Review from "./pages/Review";
import ContentHub from "./pages/ContentHub";
import Health from "./pages/Health";
import Finance from "./pages/Finance";
import Reading from "./pages/Reading";
import Habits from "./pages/Habits";
import Goals from "./pages/Goals";
import Medications from "./pages/Medications";
import Courses from "./pages/Courses";
import Journal from "./pages/Journal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function NotificationInitializer() {
  useNotifications();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationInitializer />
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <Routes>
            {/* صفحة المصادقة */}
            <Route path="/auth" element={<Auth />} />
            
            {/* إعادة التوجيه من الصفحة الرئيسية */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* الصفحات المحمية */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/review" element={<Review />} />
              <Route path="/content" element={<ContentHub />} />
              <Route path="/health" element={<Health />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/reading" element={<Reading />} />
              <Route path="/habits" element={<Habits />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/medications" element={<Medications />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/journal" element={<Journal />} />
            </Route>
            
            {/* صفحة 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
