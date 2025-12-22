import React, { useEffect, useState } from 'react';
import { Users, Building2, DollarSign, Activity, Shield, AlertTriangle, TrendingUp, Zap, Clock } from 'lucide-react';
import { MetricCard } from './MetricCard';
import api from '../../services/apiService';

const mockAttendance = [
  { id: 'NV001', name: 'Nguyễn Văn Phúc', checkIn: '08:02:15', checkOut: '17:01:30', status: 'Đã xác thực', statusColor: 'green' },
  { id: 'NV002', name: 'Trần Thị B', checkIn: '08:15:45', checkOut: '16:55:10', status: 'Cảnh báo AI', statusColor: 'yellow' },
  { id: 'NV003', name: 'Lê Văn C', checkIn: '07:59:01', checkOut: '17:00:05', status: 'Đã xác thực', statusColor: 'green' },
  { id: 'NV004', name: 'Phạm Thị D', checkIn: '08:05:20', checkOut: '17:02:40', status: 'Đã xác thực', statusColor: 'green' },
  { id: 'NV005', name: 'Huỳnh Văn E', checkIn: '09:30:11', checkOut: '17:05:00', status: 'Chờ duyệt', statusColor: 'gray' },
];

const mockPayrollTxs = [
  { hash: '0x1a9b...f3c4', employeeId: 'NV001', amount: '2.15 ETH', status: 'Đã xác nhận', time: '1 giờ trước' },
  { hash: '0x7f5e...a2d1', employeeId: 'NV002', amount: '1.98 ETH', status: 'Đã xác nhận', time: '1 giờ trước' },
  { hash: '0x9d2c...e5f6', employeeId: 'NV003', amount: '2.20 ETH', status: 'Đang xử lý', time: '1 giờ trước' },
  { hash: '0x3e7f...b8a9', employeeId: 'NV004', amount: '2.18 ETH', status: 'Đã xác nhận', time: '1 giờ trước' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, deptsRes] = await Promise.all([
            api.get('/users'),
            api.get('/departments').catch(() => ({ data: [] }))
        ]);
        
        setStats({
            totalEmployees: usersRes.data.length,
            totalDepartments: deptsRes.data.length
        });
      } catch (error) {
        console.error("Lỗi tải thống kê Dashboard:", error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Trang tổng quan Chấm công & Lương</h2>
        <p className="text-gray-600">
          Tổng quan về hệ thống chấm công minh bạch bằng AI và Blockchain.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <MetricCard 
            title="Tổng Nhân sự" 
            value={stats.totalEmployees} 
            change="Cập nhật realtime" 
            changeType="positive" 
            icon={Users} 
            color="blue" 
        />
        
        <MetricCard 
            title="Phòng ban" 
            value={stats.totalDepartments} 
            change="Hoạt động" 
            changeType="positive" 
            icon={Building2} 
            color="green" 
        />
        
        <MetricCard 
            title="Giao dịch lương (Tháng)" 
            value="452" 
            change="+15 chờ xử lý" 
            changeType="neutral" 
            icon={Activity} 
            color="purple" 
        />
        
        <MetricCard 
            title="Cảnh báo AI" 
            value="8" 
            change="Cần xem xét" 
            changeType="negative" 
            icon={AlertTriangle} 
            color="yellow" 
        />
      </div>

      {/* === BẢNG CHẤM CÔNG === */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động chấm công gần đây</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-700">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">Mã NV</th>
                <th className="text-left py-3 px-4">Tên nhân viên</th>
                <th className="text-left py-3 px-4">Giờ vào</th>
                <th className="text-left py-3 px-4">Giờ ra</th>
                <th className="text-left py-3 px-4">Trạng thái (AI)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockAttendance.map((att) => (
                <tr key={att.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-blue-600">{att.id}</td>
                  <td className="py-3 px-4">{att.name}</td>
                  <td className="py-3 px-4">{att.checkIn}</td>
                  <td className="py-3 px-4">{att.checkOut}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        att.statusColor === 'green' ? 'bg-green-100 text-green-800' :
                        att.statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {att.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Quy trình */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Quy trình Xử lý Lương Minh bạch</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-4 md:space-x-8">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium">Ghi nhận công</span>
                  <span className="text-xs text-gray-500">Hệ thống</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mb-2">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium">AI Xác thực</span>
                  <span className="text-xs text-gray-500">Tự động</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-2">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium">Quản lý duyệt</span>
                  <span className="text-xs text-gray-500">Thủ công</span>
                </div>
                <div className="w-8 h-0.5 bg-gray-300"></div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium">Trả lương</span>
                  <span className="text-xs text-gray-500">Blockchain</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cảnh báo AI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Cảnh báo AI & Hệ thống</h3>
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Phát hiện trùng lặp</p>
                <p className="text-xs text-gray-600">NV002: Check-in 2 lần lúc 08:15 và 08:16.</p>
                <p className="text-xs text-gray-400 mt-1">2 giờ trước</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Sai lệch vị trí (GPS)</p>
                <p className="text-xs text-gray-600">NV005: Check-in ngoài phạm vi văn phòng.</p>
                <p className="text-xs text-gray-400 mt-1">4 giờ trước</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Hợp đồng thông minh</p>
                <p className="text-xs text-gray-600">Cập nhật hợp đồng lương cho NV001 thành công.</p>
                <p className="text-xs text-gray-400 mt-1">6 giờ trước</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === BẢNG GIAO DỊCH === */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Lịch sử Trả lương thưởng (Blockchain)</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Transaction Hash</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Mã NV</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Số tiền</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {mockPayrollTxs.map((tx, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{tx.hash}</code>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-blue-600">{tx.employeeId}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{tx.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      tx.status === 'Đã xác nhận' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{tx.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}