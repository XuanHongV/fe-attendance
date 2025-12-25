import React, { useEffect, useState, useCallback } from 'react';
import { 
  Users, Briefcase, Activity, AlertTriangle, 
  TrendingUp, Clock, CheckCircle, Loader2, RefreshCw
} from 'lucide-react';
import { MetricCard } from './MetricCard'; 
import api from '../../services/apiService';

/* =======================
   TYPES & INTERFACES
======================= */
interface DashboardStats {
  totalEmployees: number;
  totalPositions: number;
  totalPayrollMonth: number;
  aiAlerts: number;
}

interface RecentAttendance {
  id: string;
  employee: {
    name: string;
    avatar: string;
  };
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  work_hours: number;
}

/* =======================
   HELPERS
======================= */
const formatTime = (iso?: string | null) => {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

/* =======================
   COMPONENT
======================= */
export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalPositions: 0,
    totalPayrollMonth: 0,
    aiAlerts: 0,
  });
  const [recentAttendances, setRecentAttendances] = useState<RecentAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const formatTimeFromDB = (dateInput: any) => {
    if (!dateInput) return '--:--';
    const dateStr = dateInput.$date || dateInput;
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch {
      return '--:--';
    }
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return;

      const currentUser = JSON.parse(userStr);
      const companyId = currentUser.company?._id || currentUser.company || currentUser.companyId;
      if (!companyId) return;

      const fetchSafe = async (promise: Promise<any>) => {
        try {
          const res = await promise;
          return Array.isArray(res.data) ? res.data : (res.data?.data || []);
        } catch {
          return [];
        }
      };

      const [usersData, positionsData, attendanceData, payrollData] = await Promise.all([
        fetchSafe(api.get(`/users/company/id/${companyId}`)),
        fetchSafe(api.get('/positions')),
        fetchSafe(api.get('/attendance/attendance_all')),
        fetchSafe(api.get('/timeSheets'))
      ]);

      const totalEmployees = usersData.filter((u: any) => u.role?.toUpperCase() === 'STAFF').length;
      const totalPositions = positionsData.length;
      const alerts = attendanceData.filter((a: any) => a.status === 'LATE' || a.status === 'ABSENT').length;
      
      const recent = attendanceData
        .sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt?.$date || a.createdAt).getTime();
          const dateB = new Date(b.createdAt?.$date || b.createdAt).getTime();
          return dateB - dateA;
        })
        .slice(0, 8) 
        .map((att: any) => ({
          id: att._id?.$oid || att._id,
          user: att.user || { fullName: 'N/A' },
          date: att.check_in_time?.$date || att.check_in_time || att.createdAt?.$date || att.createdAt,
          checkInTime: formatTimeFromDB(att.check_in_time),
          checkOutTime: formatTimeFromDB(att.check_out_time),
          status: att.status,
          lateMinutes: att.late_minutes 
        }));

      setRecentAttendances(recent);

      const currentMonth = new Date().toISOString().slice(0, 7);
      const payrollMonthCount = payrollData.filter((p: any) => p.month === currentMonth).length;

      setStats({
        totalEmployees,
        totalPositions,
        totalPayrollMonth: payrollMonthCount,
        aiAlerts: alerts
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const renderStatusBadge = (status: string, lateMinutes?: number) => {
    const baseClass = "px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1 w-fit border";
    switch (status) {
      case 'DONE':
      case 'PRESENT':
        return <span className={`${baseClass} bg-green-50 text-green-700 border-green-200`}><CheckCircle size={12}/> Hoàn tất</span>;
      case 'LATE':
        return <span className={`${baseClass} bg-yellow-50 text-yellow-700 border-yellow-200`}><Clock size={12}/> Late {lateMinutes }</span>;
      case 'ABSENT':
        return <span className={`${baseClass} bg-red-50 text-red-700 border-red-200`}><AlertTriangle size={12}/> Vắng mặt</span>;
      default:
        return <span className={`${baseClass} bg-slate-50 text-slate-600 border-slate-200`}>{status}</span>;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Đang tổng hợp dữ liệu</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Trang Tổng Quan</h2>
            <p className="text-slate-500 font-medium mt-1">Hệ thống quản lý nhân sự & chấm công Blockchain</p>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <RefreshCw size={16} /> Làm mới
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <MetricCard title="Tổng Nhân viên" value={stats.totalEmployees} change="Nhân sự Staff" changeType="positive" icon={Users} color="blue" />
          <MetricCard title="Vị trí Chức vụ" value={stats.totalPositions} change="Đã cấu hình" changeType="positive" icon={Briefcase} color="green" />
          <MetricCard title="Kỳ lương" value={stats.totalPayrollMonth} change="Tháng hiện tại" changeType="neutral" icon={Activity} color="purple" />
          <MetricCard title="Muộn/Vắng" value={stats.aiAlerts} change={stats.aiAlerts > 0 ? "Cần kiểm tra" : "Ổn định"} changeType={stats.aiAlerts > 0 ? "negative" : "positive"} icon={AlertTriangle} color="yellow" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                <Clock className="text-blue-600" size={24} /> Nhật ký chấm công
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-4 py-2">Nhân viên</th>
                    <th className="px-4 py-2 text-center">Ngày</th>
                    <th className="px-4 py-2 text-center">Giờ Vào</th>
                    <th className="px-4 py-2 text-center">Giờ Ra</th>
                    <th className="px-4 py-2 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttendances.map((att) => (
                    <tr key={att.id} className="bg-slate-50/50 hover:bg-blue-50/50 transition-all group">
                      <td className="py-4 px-4 rounded-l-2xl">
                        <span className="font-black text-slate-800 text-sm group-hover:text-blue-700">{att.user?.fullName}</span>
                      </td>
                      <td className="py-4 px-4 text-center text-xs font-bold text-slate-500">
                        {new Date(att.date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-4 px-4 text-center font-black text-xs text-blue-600 font-mono">
                        {att.checkInTime}
                      </td>
                      <td className="py-4 px-4 text-center font-black text-xs text-purple-600 font-mono">
                        {att.checkOutTime}
                      </td>
                      <td className="py-4 px-4 rounded-r-2xl flex justify-end">
                        {renderStatusBadge(att.status, att.lateMinutes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white p-8">
              <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Hệ thống</h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Blockchain Node</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-green-600 uppercase">Online</span>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">API Gateway</span>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Active</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-200">
              <TrendingUp size={32} className="mb-4 opacity-50" />
              <h4 className="font-black text-lg mb-2 tracking-tight">Số liệu thực tế</h4>
              <p className="text-blue-100 text-[11px] leading-relaxed font-medium">
                Dữ liệu được truy xuất trực tiếp từ các khối Blockchain, đảm bảo tính minh bạch và không thể chỉnh sửa thông tin chấm công.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
