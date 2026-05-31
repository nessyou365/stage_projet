import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  Briefcase,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import hireqMark from "@/assets/hireq-mark.svg";
import { cn } from "@/lib/utils";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Job Offers", url: "/jobs", icon: Briefcase },
  { title: "Candidates", url: "/candidates", icon: Users },
  { title: "Spontaneous", url: "/spontaneous", icon: Inbox },
  { title: "Pipeline", url: "/pipeline", icon: GitBranch },
];

const aiNav = [
  { title: "AI Analysis", url: "/ai-analysis", icon: Sparkles },
  { title: "Rankings", url: "/ranking", icon: Trophy },
  { title: "Interviews", url: "/interviews", icon: MessageSquare },
];

const managementNav = [
  { title: "Decisions", url: "/decisions", icon: CheckCircle },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { userName, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const renderItems = (items) => items.map((item) => (
    <NavLink
      key={`${item.title}-${item.url}`}
      to={item.url}
      className={({ isActive }) => cn(
        "group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-[13px] font-semibold transition-all duration-300",
        isActive
          ? "bg-gradient-to-r from-[#ff6a00] to-[#ff8a00] text-white shadow-[0_16px_35px_rgba(255,106,0,0.32)]"
          : "text-white/86 hover:bg-white/10 hover:text-white",
        collapsed && "justify-center px-3",
      )}
    >
      <item.icon className="h-[19px] w-[19px] shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
      {!collapsed && item.title === "Dashboard" && <ChevronRight size={15} className="opacity-90" />}
    </NavLink>
  ));

  const section = (title, items) => (
    <div>
      {!collapsed && <p className="mb-2 px-4 text-[11px] font-bold uppercase tracking-[0.08em] text-white/58">{title}</p>}
      <div className="space-y-1.5">{renderItems(items)}</div>
    </div>
  );

  return (
    <aside className={cn(
      "relative z-20 flex h-screen shrink-0 flex-col border-r border-white/10 bg-[#001d58] text-white shadow-[16px_0_45px_rgba(0,25,74,0.22)] transition-all duration-300",
      collapsed ? "w-[72px]" : "w-[230px]",
    )}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(35,108,255,0.34),transparent_32%),linear-gradient(180deg,rgba(0,14,47,0.12),rgba(0,9,35,0.5))]" />

      <div className="relative flex items-center justify-between px-4 pb-7 pt-7">
        <div className="flex min-w-0 items-center gap-2.5">
          <img src={hireqMark} alt="HireQ" className="h-11 w-11 shrink-0 rounded-2xl shadow-[0_18px_35px_rgba(0,0,0,0.18)]" />
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-[25px] font-extrabold leading-none tracking-[-0.04em]">
                Hire<span className="text-[#ff8500]">Q</span>
              </h1>
              <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.04em] text-white/76">AI-powered recruitment</p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-3 top-8 rounded-full p-1 text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="sidebar-scroll relative flex-1 space-y-5 overflow-y-auto px-4 pb-5 pr-2">
        {section("Overview", mainNav)}
        {section("AI Tools", aiNav)}
        {section("Management", managementNav)}
      </nav>

      <div className="relative space-y-3 border-t border-white/10 p-4">
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/8 p-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#001d58] font-extrabold">
            {(userName || "A")[0].toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold">{userName || "Admin RH"}</p>
                <p className="text-xs text-white/68">HR Manager</p>
              </div>
              <ChevronDown size={15} className="text-white/70" />
            </>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-[13px] font-semibold text-white/80 transition hover:bg-white/10 hover:text-white",
            collapsed && "justify-center",
          )}
        >
          <LogOut size={17} />
          {!collapsed && "Logout"}
        </button>
      </div>
    </aside>
  );
}
