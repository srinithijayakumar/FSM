import { useLocation, Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, FolderKanban, Wrench, CreditCard,
  Package, UserCog, UserCircle, FileText, LogOut, Bug
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FC } from "react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Leads", icon: Users, path: "/leads" },
  { label: "Work Orders", icon: FolderKanban, path: "/projects" },
  { label: "Service Appointments", icon: Wrench, path: "/services" },
  { label: "Payments", icon: CreditCard, path: "/payments" },
  { label: "Reports", icon: FileText, path: "/reports" },
  { label: "Inventory", icon: Package, path: "/inventory" },
  { label: "Employees", icon: UserCog, path: "/employees" },
  { label: "Customers", icon: UserCircle, path: "/customers" },
];

type AppSidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export const AppSidebar: FC<AppSidebarProps> = ({ className, onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className={cn("w-64 h-svh bg-card border-r border-border flex flex-col shrink-0", className)}>
      <div className="p-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(138.75deg, #942BF4 -42.53%, #1E2F96 94.59%)" }}>
          <Bug className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-primary">Easy Pest Control</h1>
          <p className="text-[10px] text-muted-foreground">Admin Panel</p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-secondary text-primary"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-xs font-bold text-primary">AK</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-card-foreground truncate">Admin Kumar</p>
            <p className="text-[11px] text-muted-foreground">Branch Manager</p>
          </div>
          <button
            onClick={() => {
              navigate("/login");
              onNavigate?.();
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
