import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
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
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../store/slices/authSlice';
import toastService from '../../services/toastService';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    mobileOpen: boolean;
    onLogout: () => void;
    setMobileOpen: (open: boolean) => void;
}

const adminItems = [
    { id: 'dashboard', label: 'Trang tổng quan', icon: Home },
    { id: 'employees', label: 'Quản lý Nhân viên', icon: Users },
    { id: 'positions', label: 'Quản lý Vị trí', icon: Building },
    { id: 'shifts', label: 'Cấu hình Ca', icon: Briefcase },
    { id: 'schedule', label: 'Phân Ca', icon: Calendar },
    { id: 'attendance', label: 'Quản lý Chấm công', icon: Clock },
    { id: 'payroll', label: 'Quản lý Bảng lương', icon: DollarSign },
];

const staffItems = [
    { id: 'staff/shift', label: 'Lịch làm việc', icon: Calendar },
    { id: 'staff/timekeeping', label: 'Chấm công (Camera)', icon: Camera },
    { id: 'staff/payroll', label: 'Lương của tôi', icon: DollarSign },
];

export const Sidebar: React.FC<SidebarProps> = ({
    activeTab,
    onTabChange,
    mobileOpen,
    setMobileOpen,
    onLogout,
}) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const isManagement = user?.role === 'ADMIN' || user?.role === 'MANAGER';
    const menuItems = isManagement ? adminItems : staffItems;
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const handleLogoutClick = async () => {
        const isConfirmed = await toastService.confirm(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất không?',
            'Đăng xuất',
            'Hủy'
        );
        if (isConfirmed) {
            dispatch(logoutUser());
            if (onLogout) {
                onLogout();
            }
            setMobileOpen(false);
            navigate('/login', { replace: true });
            toastService.success('Đã đăng xuất thành công!');
        }
    };
    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
                    mobileOpen
                        ? 'opacity-100 pointer-events-auto'
                        : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setMobileOpen(false)}
            />

            <aside
                className={`
        fixed md:static inset-y-0 left-0 z-50
        bg-[#0F172A] text-slate-300 w-72 min-h-screen flex flex-col 
        transition-transform duration-300 ease-in-out shadow-2xl border-r border-slate-800
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}
            >
                <div className='h-20 flex items-center justify-between px-6 border-b border-slate-800/50 bg-[#020617]/40'>
                    <div className='flex items-center gap-3 font-black text-white text-xl tracking-tighter'>
                        <div className='p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/40'>
                            <ShieldCheck size={20} className='text-white' />
                        </div>
                        <span>
                            PAYROLL<span className='text-blue-500'>PRO</span>
                        </span>
                    </div>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className='md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all'
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className='p-6'>
                    <div className='bg-slate-800/40 rounded-[1.5rem] p-4 flex items-center gap-4 border border-slate-700/50 shadow-inner'>
                        <div className='w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shrink-0 border border-white/10 text-lg'>
                            {user?.fullName?.charAt(0).toUpperCase() || (
                                <User size={20} />
                            )}
                        </div>
                        <div className='overflow-hidden'>
                            <p className='text-sm font-black text-white truncate tracking-tight'>
                                {user?.fullName || 'User Account'}
                            </p>
                            <p className='text-[9px] uppercase font-black text-blue-400 tracking-[0.15em] mt-0.5 opacity-80'>
                                {user?.role === 'ADMIN'
                                    ? 'Administrator'
                                    : 'Staff Member'}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className='flex-1 overflow-y-auto px-4 py-2 space-y-1.5 custom-scrollbar'>
                    {/* <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 mt-2 opacity-50">
            Hệ thống quản lý
          </p> */}
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive =
                            activeTab === item.id || activeTab.startsWith(item.id + '/');

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onTabChange(item.id);
                                    setMobileOpen(false);
                                }}
                                className={`w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-[1.2rem] text-sm font-bold transition-all duration-300 group relative
                  ${
                      isActive
                          ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1'
                  }
                `}
                            >
                                <Icon
                                    className={`h-5 w-5 transition-transform duration-300 ${
                                        isActive
                                            ? 'scale-110'
                                            : 'text-slate-500 group-hover:scale-110'
                                    }`}
                                />
                                <span className='tracking-tight'>{item.label}</span>
                                {isActive && (
                                    <span className='absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]'></span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className='p-4 space-y-4 border-t border-slate-800/60 bg-[#020617]/20'>
                    <button
                        onClick={handleLogoutClick}
                        className='w-full flex items-center space-x-3.5 px-4 py-3.5 rounded-[1.2rem] text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 group'
                    >
                        <div className='p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors'>
                            <LogOut size={18} />
                        </div>
                        <span className='tracking-tight'>Đăng xuất</span>
                    </button>

                    <div className='flex items-center justify-between px-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest'>
                        <span>Phiên bản 2.0.1</span>
                        <div className='flex items-center gap-1.5 text-emerald-500/80'>
                            <span className='relative flex h-2 w-2'>
                                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                                <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500'></span>
                            </span>
                            <span>Online</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};
