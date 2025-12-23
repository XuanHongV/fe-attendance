import React, { useEffect, useState } from "react";
import {
  Users,
  Briefcase,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
  XCircle,
} from "lucide-react";
import { MetricCard } from "./MetricCard";
import api from "../../services/apiService";

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

  const [recentAttendances, setRecentAttendances] = useState<
    RecentAttendance[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;

        const currentUser = JSON.parse(userStr);
        const companyId = currentUser.company?._id || currentUser.company;

        if (!companyId) return;

        // Hàm helper gọi API an toàn
        const fetchSafe = async (promise: Promise<any>) => {
          try {
            const res = await promise;
            // Xử lý linh hoạt các kiểu trả về của NestJS
            return res.data?.data || res.data || [];
          } catch (e) {
            return [];
          }
        };

        const [usersData, positionsData, attendanceData, payrollData] =
          await Promise.all([
            fetchSafe(api.get(`/users/company/id/${companyId}`)),
            fetchSafe(api.get("/positions")),
            fetchSafe(api.get("/attendance/attendance_all")), // Đã sửa URL đúng với Controller
            fetchSafe(api.get("/payroll-payment")),
          ]);

        // 1. Tính toán số lượng nhân viên (Staff)
        const totalEmployees = usersData.filter(
          (u: any) => u.role?.toUpperCase() === "STAFF"
        ).length;

        // 2. Tính số cảnh báo (Đi trễ hoặc Vắng mặt)
        const alerts = attendanceData.filter(
          (a: any) => a.status === "LATE" || a.status === "ABSENT"
        ).length;

        // 3. Lấy 5 bản ghi chấm công mới nhất
        setRecentAttendances(attendanceData.slice(0, 5));

        // 4. Đếm số phiếu lương tháng hiện tại
        const currentMonth = new Date().toISOString().slice(0, 7);
        const payrollCount = payrollData.filter(
          (p: any) => p.month === currentMonth
        ).length;

        setStats({
          totalEmployees,
          totalPositions: positionsData.length,
          totalPayrollMonth: payrollCount,
          aiAlerts: alerts,
        });
      } catch (error) {
        console.error("Lỗi tải Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "DONE":
      case "PRESENT":
        return (
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
            <CheckCircle size={12} /> Hoàn thành
          </span>
        );
      case "LATE":
        return (
          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
            <Clock size={12} /> Đi muộn
          </span>
        );
      case "ABSENT":
        return (
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
            <XCircle size={12} /> Vắng mặt
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold w-fit">
            {status}
          </span>
        );
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <span className="text-gray-500 text-sm">Đang tải dữ liệu...</span>
        </div>
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Trang tổng quan
        </h2>
        <p className="text-gray-600">
          Tổng quan hệ thống chấm công và tính lương.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Tổng Nhân viên"
          value={stats.totalEmployees}
          change="Đang hoạt động"
          changeType="positive"
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Vị trí / Chức vụ"
          value={stats.totalPositions}
          change="Cấu hình"
          changeType="positive"
          icon={Briefcase}
          color="green"
        />
        <MetricCard
          title="Giao dịch Lương"
          value={stats.totalPayrollMonth}
          change="Tháng này"
          changeType="neutral"
          icon={Activity}
          color="purple"
        />
        <MetricCard
          title="Cảnh báo AI"
          value={stats.aiAlerts}
          change={stats.aiAlerts > 0 ? "Cần xử lý" : "Ổn định"}
          changeType={stats.aiAlerts > 0 ? "negative" : "positive"}
          icon={AlertTriangle}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="text-blue-500" size={20} /> Hoạt động chấm công
              gần đây
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">
                    Nhân viên
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">Ngày</th>
                  <th className="text-left py-3 px-4 font-semibold">Vào</th>
                  <th className="text-left py-3 px-4 font-semibold">Ra</th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentAttendances.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-8 text-gray-400 italic"
                    >
                      Chưa có dữ liệu chấm công nào.
                    </td>
                  </tr>
                ) : (
                  recentAttendances.map((att) => (
                    <tr
                      key={att.id}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              att.employee?.avatar ||
                              "https://ui-avatars.com/api/?name=U"
                            }
                            className="w-7 h-7 rounded-full"
                            alt="avatar"
                          />
                          <div className="font-bold text-gray-900">
                            {att.employee?.name || "Unknown"}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {new Date(att.date).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-3 px-4 font-mono text-blue-600">
                        {formatTime(att.check_in_time)}
                      </td>
                      <td className="py-3 px-4 font-mono text-purple-600">
                        {formatTime(att.check_out_time)}
                      </td>
                      <td className="py-3 px-4">
                        {renderStatusBadge(att.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Health Check</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-green-600 font-medium">Online</span>
            </div>
          </div>
          <div className="space-y-4 flex-1">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-slate-600" />
                <span className="font-bold text-slate-700 text-sm">
                  Hệ thống
                </span>
              </div>
              <div className="text-xs text-gray-500">
                <p>Kết nối: Ổn định</p>
                <p>Đồng bộ cuối: {new Date().toLocaleTimeString()}</p>
                <p>Nguồn: Real-time Database</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
