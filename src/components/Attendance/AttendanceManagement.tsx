import React, { useState, useEffect, FormEvent } from 'react';
import { Search, Filter, Clock, CheckCircle, AlertTriangle, XCircle, Calendar, Edit, Save, X, Loader2, Plus } from 'lucide-react';
import { AttendanceRecord, Employee } from '../../types';
import api from '../../services/apiService';

const getStatusProps = (status: string) => {
  switch (status) {
    case 'verified': return { icon: CheckCircle, color: 'text-green-600 bg-green-100', text: 'Đã xác thực' };
    case 'pending_approval': return { icon: Clock, color: 'text-blue-600 bg-blue-100', text: 'Chờ duyệt' };
    case 'ai_alert': return { icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-100', text: 'Cảnh báo AI' };
    default: return { icon: XCircle, color: 'text-gray-600 bg-gray-100', text: 'Chưa rõ' };
  }
};

export const AttendanceManagement: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attRes, empRes] = await Promise.all([
        api.get('/attendance'),
        api.get('/users')
      ]);

      const mappedAttendance = attRes.data.map((record: any) => ({
        id: record._id,
        employeeId: record.user?._id || 'Unknown',
        employeeName: record.user?.fullName || 'Nhân viên',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(record.user?.fullName || 'U')}&background=random`,
        date: record.date,
        checkInTime: record.checkInTime || '--:--',
        checkOutTime: record.checkOutTime || '--:--',
        workHours: record.workHours || 0,
        status: record.status || 'pending_approval',
      }));
      setAttendanceRecords(mappedAttendance);

      const staff = empRes.data.filter((u: any) => u.role === 'STAFF').map((u: any) => ({
        id: u._id,
        fullName: u.fullName
      }));
      setEmployees(staff);

    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
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
      const workHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

      const payload = {
        user: newAttendance.userId,
        date: newAttendance.date,
        checkInTime: newAttendance.checkInTime,
        checkOutTime: newAttendance.checkOutTime,
        workHours: workHours > 0 ? parseFloat(workHours.toFixed(2)) : 0,
        status: 'verified'
      };

      await api.post('/attendance', payload);

      alert("Chấm công thành công!");
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

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentRecord) return;
    const form = e.target as HTMLFormElement;
    const checkIn = (form.elements.namedItem('checkIn') as HTMLInputElement).value;
    const checkOut = (form.elements.namedItem('checkOut') as HTMLInputElement).value;

    const start = new Date(`2000-01-01T${checkIn}`);
    const end = new Date(`2000-01-01T${checkOut}`);
    const workHours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));

    try {
      await api.patch(`/attendance/${currentRecord.id}`, {
        checkInTime: checkIn, checkOutTime: checkOut, workHours, status: 'verified'
      });
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) { alert("Lỗi cập nhật."); }
  };

  // Loc
  const filteredData = attendanceRecords.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesDate = !selectedDate || record.date === selectedDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quản lý Chấm công</h2>
        <p className="text-gray-600">Xem xét và xác thực dữ liệu chấm công hàng ngày.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text" placeholder="Tìm nhân viên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="outline-none text-sm text-gray-700" />
            </div>

            <div className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg">
              <Filter className="h-4 w-4 text-gray-500 mr-2" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="outline-none text-sm text-gray-700 bg-white">
                <option value="all">Tất cả</option>
                <option value="verified">Đã xác thực</option>
                <option value="pending_approval">Chờ duyệt</option>
                <option value="ai_alert">Cảnh báo AI</option>
              </select>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus size={18} /> Thêm Chấm công
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Nhân viên</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Ngày</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Giờ vào</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Giờ ra</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Tổng giờ</th>
                <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                <th className="py-4 px-6 text-right text-sm font-semibold text-gray-700">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-500">Không tìm thấy dữ liệu.</td></tr>
              ) : (
                filteredData.map((record) => {
                  const statusProps = getStatusProps(record.status);
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img src={record.avatar} alt="avt" className="w-8 h-8 rounded-full" />
                          <span className="text-sm font-medium text-gray-900">{record.employeeName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{record.date}</td>
                      <td className="py-4 px-6 text-sm font-mono">{record.checkInTime}</td>
                      <td className="py-4 px-6 text-sm font-mono">{record.checkOutTime}</td>
                      <td className="py-4 px-6 text-sm font-bold">{record.workHours?.toFixed(2)}h</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusProps.color}`}>
                          <statusProps.icon className="w-3 h-3 mr-1" /> {statusProps.text}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right flex justify-end gap-2">
                        {record.status !== 'verified' && (
                          <button onClick={() => handleApprove(record.id)} className="text-green-600 bg-green-50 p-1.5 rounded hover:bg-green-100">
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button onClick={() => { setCurrentRecord(record); setIsEditModalOpen(true); }} className="text-blue-600 bg-blue-50 p-1.5 rounded hover:bg-blue-100">
                          <Edit size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Thêm Chấm công Thủ công</h3>
              <button onClick={() => setIsAddModalOpen(false)}><X className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreateAttendance} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nhân viên</label>
                <select
                  className="w-full border p-2 rounded-lg"
                  value={newAttendance.userId}
                  onChange={e => setNewAttendance({ ...newAttendance, userId: e.target.value })}
                  required
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ngày</label>
                <input type="date" className="w-full border p-2 rounded-lg" value={newAttendance.date} onChange={e => setNewAttendance({ ...newAttendance, date: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Giờ vào</label>
                  <input type="time" className="w-full border p-2 rounded-lg" value={newAttendance.checkInTime} onChange={e => setNewAttendance({ ...newAttendance, checkInTime: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giờ ra</label>
                  <input type="time" className="w-full border p-2 rounded-lg" value={newAttendance.checkOutTime} onChange={e => setNewAttendance({ ...newAttendance, checkOutTime: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">Lưu Chấm công</button>
            </form>
          </div>
        </div>
      )}


      {isEditModalOpen && currentRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold mb-4">Sửa Giờ Công: {currentRecord.employeeName}</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <input type="time" name="checkIn" defaultValue={currentRecord.checkInTime} className="w-full border p-2 rounded-lg" />
              <input type="time" name="checkOut" defaultValue={currentRecord.checkOutTime} className="w-full border p-2 rounded-lg" />
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border rounded-lg">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};