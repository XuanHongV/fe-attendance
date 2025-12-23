import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import {
  Home,
  Users,
  Building,
  Clock,
  DollarSign,
  Calendar,
  Briefcase,
  Camera,
  ShieldCheck,
  User,
  X,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  // 👇 Thêm props mới để điều khiển mobile
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const adminItems = [
  { id: "dashboard", label: "Trang tổng quan", icon: Home },
  { id: "employees", label: "Quản lý Nhân viên", icon: Users },
  { id: "positions", label: "Quản lý Vị trí", icon: Building },
  { id: "shifts", label: "Cấu hình Ca", icon: Briefcase },
  { id: "schedule", label: "Phân Ca", icon: Calendar },
  { id: "attendance", label: "Quản lý Chấm công", icon: Clock },
  { id: "payroll", label: "Quản lý Bảng lương", icon: DollarSign },
];

const staffItems = [
  { id: "staff/shift", label: "Lịch làm việc", icon: Calendar },
  { id: "staff/timekeeping", label: "Chấm công (Camera)", icon: Camera },
  { id: "staff/payroll", label: "Lương của tôi", icon: DollarSign },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  mobileOpen,
  setMobileOpen,
}) => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isManagement = user?.role === "ADMIN" || user?.role === "MANAGER";
  const menuItems = isManagement ? adminItems : staffItems;

  return (
    <>
      {/* 1. MOBILE OVERLAY: Lớp nền tối khi mở menu trên mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* 2. MAIN SIDEBAR */}
      <aside
        className={`
        fixed md:static inset-y-0 left-0 z-50
        bg-slate-900 text-slate-300 w-64 min-h-screen flex flex-col 
        transition-transform duration-300 ease-in-out shadow-2xl border-r border-slate-800
        
        /* LOGIC RESPONSIVE QUAN TRỌNG: */
        /* Mobile: Trượt ra/vào dựa trên state mobileOpen */
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        /* Desktop: Luôn hiển thị (reset translate) */
        md:translate-x-0
      `}
      >
        {/* Header Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/50 bg-slate-950/30">
          <div className="flex items-center gap-2 font-bold text-white text-lg tracking-wider">
            <ShieldCheck className="text-blue-500" />
            <span>
              PAYROLL <span className="text-blue-500">PRO</span>
            </span>
          </div>
          {/* Nút đóng (X) chỉ hiện trên mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* User Profile */}
        <div className="p-4">
          <div className="bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 border border-slate-700/50 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shrink-0">
              {user?.fullName?.charAt(0) || <User size={20} />}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">
                {user?.fullName || "User"}
              </p>
              <p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider truncate">
                {user?.role === "ADMIN" ? "Administrator" : "Staff Member"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
          <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">
            Menu Chính
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id || activeTab.startsWith(item.id + "/");

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileOpen(false); // Quan trọng: Đóng menu sau khi click trên mobile
                }}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/20 rounded-r-full"></span>
                )}

                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-slate-500 group-hover:text-white"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>v2.0.1</span>
            <span className="flex items-center gap-1 text-emerald-500 font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>{" "}
              Online
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
