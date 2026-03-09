import { 
  LayoutDashboard, CheckSquare, Calendar, Wallet, Sparkles,
  Target, Book, Pill, GraduationCap, Heart, FolderKanban,
  BarChart3, FileText, Settings, BookOpen
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const mainItems = [
  { title: 'الرئيسية', url: '/dashboard', icon: LayoutDashboard },
  { title: 'المهام', url: '/tasks', icon: CheckSquare },
  { title: 'التقويم', url: '/planner', icon: Calendar },
  { title: 'المالية', url: '/finance', icon: Wallet },
  { title: 'المساعد', url: '/assistant', icon: Sparkles },
];

const productivityItems = [
  { title: 'الأهداف', url: '/goals', icon: Target },
  { title: 'المشاريع', url: '/projects', icon: FolderKanban },
  { title: 'العادات', url: '/habits', icon: BookOpen },
  { title: 'التحليلات', url: '/analytics', icon: BarChart3 },
];

const lifeItems = [
  { title: 'الصحة', url: '/health', icon: Heart },
  { title: 'الأدوية', url: '/medications', icon: Pill },
  { title: 'القراءة', url: '/reading', icon: Book },
  { title: 'الكورسات', url: '/courses', icon: GraduationCap },
  { title: 'اليوميات', url: '/journal', icon: FileText },
];

const otherItems = [
  { title: 'المحتوى', url: '/content', icon: FileText },
  { title: 'المراجعة', url: '/review', icon: CheckSquare },
  { title: 'الإعدادات', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-muted-foreground/70 text-xs">
        {!collapsed && label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                <NavLink 
                  to={item.url} 
                  end 
                  className="hover:bg-muted/50 gap-3" 
                  activeClassName="bg-primary/10 text-primary font-medium"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" side="right" className="border-l border-r-0">
      <SidebarContent className="pt-4">
        {renderGroup('القائمة الرئيسية', mainItems)}
        {renderGroup('الإنتاجية', productivityItems)}
        {renderGroup('الحياة', lifeItems)}
        {renderGroup('أخرى', otherItems)}
      </SidebarContent>
    </Sidebar>
  );
}
