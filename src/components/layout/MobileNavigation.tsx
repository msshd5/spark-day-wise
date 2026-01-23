import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  FolderKanban, 
  Calendar,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
  { to: '/tasks', icon: CheckSquare, label: 'المهام' },
  { to: '/planner', icon: Calendar, label: 'التقويم' },
  { to: '/projects', icon: FolderKanban, label: 'المشاريع' },
  { to: '/assistant', icon: Sparkles, label: 'المساعد' },
];

export function MobileNavigation() {
  return (
    <nav className="mobile-nav z-50">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
