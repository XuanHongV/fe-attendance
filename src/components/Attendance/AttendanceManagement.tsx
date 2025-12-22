import React, { useState, useEffect, FormEvent } from 'react';
import { Search, Filter, Clock, CheckCircle, AlertTriangle, XCircle, Calendar, Edit, X, Plus, User } from 'lucide-react';
import api from '../../services/apiService';

// Interfaces
interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  avatar: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  workHours: number;
  status: 'verified' | 'pending_approval' | 'ai_alert';
}

interface EmployeeOption {
  id: string;
  fullName: string;
  role?: string;
}

const getStatusProps = (status: string) => {
  switch (status) {
    case 'verified': return { icon: CheckCircle, color: 'text-green-700 bg-green-100 border-green-200', text: 'Đã xác thực' };
    case 'pending_approval': return { icon: Clock, color: 'text-blue-700 bg-blue-100 border-blue-200', text: 'Chờ duyệt' };
    case 'ai_alert': return { icon: AlertTriangle, color: 'text-orange-700 bg-orange-100 border-orange-200', text: 'Cảnh báo AI' };
    default: return { icon: XCircle, color: 'text-gray-700 bg-gray-100 border-gray-200', text: 'Chưa rõ' };
  }
};

export const AttendanceManagement: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(null);

  const [newAttendance, setNewAttendance] = useState({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '08:00',
    checkOutTime: '17:00'
  });

  // --- LOGIC FETCH DATA AN TOÀN ---
  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("🚀 Bắt đầu tải dữ liệu Chấm công...");

      // 1. Lấy Company ID an toàn
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const companyId = currentUser?.company?._id 
          || (typeof currentUser?.company === 'string' ? currentUser.company : null);

      if (!companyId) {
          console.error("❌ Lỗi: Không tìm thấy Company ID.");
          alert("Vui lòng đăng nhập lại để tải dữ liệu.");
          setLoading(false);
          return;
      }

      console.log("Company ID:", companyId);

      // 2. Gọi API song song
      const [attRes, empRes] = await Promise.all([
        api.get('/attendance'),
        api.get(`/users/company/id/${companyId}`)
      ]);

      console.log("Raw API Users Response:", empRes.data);

      const rawAttendance = Array.isArray(attRes.data) ? attRes.data : (attRes.data?.data || []);
      const mappedAttendance = rawAttendance.map((record: any) => ({
        id: record._id,
        employeeId: record.user?._id || 'Unknown',
        employeeName: record.user?.fullName || 'Nhân viên (Đã xóa)',
        avatar: record.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(record.user?.fullName || 'U')}&background=random`,
        date: record.date ? record.date.split('T')[0] : '',
        checkInTime: record.checkInTime || '--:--',
        checkOutTime: record.checkOutTime || '--:--',
        workHours: record.workHours || 0,
        status: record.status || 'pending_approval',
      }));
      setAttendanceRecords(mappedAttendance);

      // 4. Xử lý dữ liệu Nhân viên (QUAN TRỌNG: Kiểm tra cấu trúc mảng)
      const rawUsers = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.data || []);
      
      // Lọc lỏng hơn: Chuyển role về uppercase để so sánh
      const staffList = rawUsers
        .filter((u: any) => u.role?.toUpperCase() === 'STAFF') 
        .map((u: any) => ({
            id: u._id,
            fullName: u.fullName,
            role: u.role
        }));
      
      console.log("✅ Danh sách nhân viên lọc được:", staffList);
      setEmployees(staffList);

    } catch (error) {
      console.error(" Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAttendance = async (e: FormEvent) => {
    e.preventDefault();
    if (!newAttendance.userId) {
      alert("Vui lòng chọn nhân viên!");
      return;
    }

    try {
      const start = new Date(`2000-01-01T${newAttendance.checkInTime}`);
      const end = new Date(`2000-01-01T${newAttendance.checkOutTime}`);
      let workHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (workHours < 0) workHours += 24;

      const payload = {
        user: newAttendance.userId,
        date: newAttendance.date,
        checkInTime: newAttendance.checkInTime,
        checkOutTime: newAttendance.checkOutTime,
        workHours: parseFloat(workHours.toFixed(2)),
        status: 'verified'
      };

      await api.post('/attendance', payload);
      alert("Thêm chấm công thành công!");
      setIsAddModalOpen(false);
      fetchData();

    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Lỗi khi tạo chấm công");
    }
  };

  const handleApprove = async (recordId: string) => {
    if (!window.confirm("Xác nhận duyệt?")) return;
    try {
      await api.patch(`/attendance/${recordId}`, { status: 'verified' });
      fetchData();
    } catch (error) { alert("Lỗi duyệt."); }
  };

  // Filter
  const filteredData = attendanceRecords.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesDate = !selectedDate || record.date === selectedDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Clock className="text-blue-600" /> Quản lý Chấm công
            </h2>
            <p className="text-gray-600 text-sm">Xem xét và xác thực dữ liệu chấm công hàng ngày.</p>
        </div>
        <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition-all font-medium active:scale-95"
        >
            <Plus size={18} /> Thêm Thủ Công
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text" placeholder="Tìm tên nhân viên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg min-w-[150px]">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="outline-none text-sm text-gray-700 bg-transparent w-full cursor-pointer" />
            </div>
            <div className="flex items-center px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg min-w-[150px]">
              <Filter className="h-4 w-4 text-gray-500 mr-2" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="outline-none text-sm text-gray-700 bg-transparent w-full cursor-pointer">
                <option value="all">Tất cả trạng thái</option>
                <option value="verified">Đã xác thực</option>
                <option value="pending_approval">Chờ duyệt</option>
                <option value="ai_alert">Cảnh báo AI</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nhân viên</th>
                <th className="py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày</th>
                <th className="py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Vào</th>
                <th className="py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Ra</th>
                <th className="py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng giờ</th>
                <th className="py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="py-4 px-6 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-500 animate-pulse">Đang tải dữ liệu...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-500 italic">Không tìm thấy dữ liệu phù hợp.</td></tr>
              ) : (
                filteredData.map((record) => {
                  const statusProps = getStatusProps(record.status);
                  return (
                    <tr key={record.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img src={record.avatar} alt="avt" className="w-9 h-9 rounded-full border border-gray-200 object-cover" />
                          <div>
                              <p className="text-sm font-bold text-gray-900">{record.employeeName}</p>
                              <p className="text-xs text-gray-500">ID: {record.employeeId.slice(-4)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-600 whitespace-nowrap">{new Date(record.date).toLocaleDateString('vi-VN')}</td>
                      <td className="py-4 px-6 text-center text-sm font-mono text-blue-600 bg-blue-50/50 rounded">{record.checkInTime}</td>
                      <td className="py-4 px-6 text-center text-sm font-mono text-purple-600 bg-purple-50/50 rounded">{record.checkOutTime}</td>
                      <td className="py-4 px-6 text-center text-sm font-bold text-gray-800">{record.workHours?.toFixed(2)}h</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusProps.color}`}>
                          <statusProps.icon className="w-3 h-3 mr-1" /> {statusProps.text}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                            {record.status !== 'verified' && (
                            <button onClick={() => handleApprove(record.id)} className="text-green-600 bg-green-50 p-2 rounded-lg hover:bg-green-100 transition-colors" title="Duyệt">
                                <CheckCircle size={16} />
                            </button>
                            )}
                            <button onClick={() => { setCurrentRecord(record); setIsEditModalOpen(true); }} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100 transition-colors" title="Sửa">
                                <Edit size={16} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD MODAL (RESPONSIVE) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-[95%] md:w-full max-w-md overflow-hidden transform transition-all scale-100">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Thêm Chấm công</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleCreateAttendance} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
                    <User size={16} /> Nhân viên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    value={newAttendance.userId}
                    onChange={e => setNewAttendance({ ...newAttendance, userId: e.target.value })}
                    required
                    >
                    <option value="">-- Chọn nhân viên --</option>
                    {employees.length === 0 ? (
                        <option disabled>Đang tải hoặc không có nhân viên...</option>
                    ) : (
                        employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                        ))
                    )}
                    </select>
                    {/* Mũi tên dropdown custom nếu cần */}
                </div>
                {employees.length === 0 && !loading && (
                    <p className="text-xs text-red-500 mt-1">⚠️ Không tìm thấy nhân viên (STAFF) trong công ty.</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Ngày làm việc</label>
                <input type="date" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={newAttendance.date} onChange={e => setNewAttendance({ ...newAttendance, date: e.target.value })} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Giờ vào</label>
                  <input type="time" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={newAttendance.checkInTime} onChange={e => setNewAttendance({ ...newAttendance, checkInTime: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Giờ ra</label>
                  <input type="time" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={newAttendance.checkOutTime} onChange={e => setNewAttendance({ ...newAttendance, checkOutTime: e.target.value })} required />
                </div>
              </div>

              <div className="pt-2">
                  <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2">
                      <CheckCircle size={18} /> Lưu Chấm công
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};