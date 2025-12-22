import React, { useState, useEffect, FormEvent } from 'react';
import { Plus, Clock, Trash2, Edit, Save, X, Briefcase, Loader2 } from 'lucide-react';
import { Shift } from '../../types';
import api from '../../services/apiService';

export const ShiftManagement = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: ''
  });

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/shifts');
      const mappedShifts = response.data.map((s: any) => ({
        id: s._id || s.id,
        name: s.name,
        startTime: s.startTime || s.start_time,
        endTime: s.endTime || s.end_time,
        company: s.company
      }));

      setShifts(mappedShifts);
    } catch (error) {
      console.error("Lỗi tải ca làm việc:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.startTime || !formData.endTime) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        start_time: formData.startTime,
        end_time: formData.endTime,
        type: 'FULLTIME',

        allowance: 0,
        color_code: '#3b82f6'
      };

      console.log("Payload gửi đi:", payload);

      await api.post('/shifts', payload);

      alert("Thêm ca làm việc thành công!");
      setIsModalOpen(false);
      setFormData({ name: '', startTime: '', endTime: '' });
      fetchShifts();

    } catch (error: any) {
      console.error("Lỗi tạo ca:", error);
      const message = error.response?.data?.message;
      alert(Array.isArray(message) ? message.join('\n') : (message || "Lỗi khi tạo ca"));
    }
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ca làm việc này?")) return;
    try {
      await api.delete(`/shifts/${id}`);
      fetchShifts();
    } catch (error) {
      alert("Lỗi khi xóa ca.");
    }
  };

  const calculateDuration = (start: string, end: string) => {
    const s = parseInt(start.split(':')[0]);
    const e = parseInt(end.split(':')[0]);
    let duration = e - s;
    if (duration < 0) duration += 24; // Xử lý ca khi qua đêm
    return duration;
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cấu hình Ca làm việc</h2>
          <p className="text-gray-600">Thiết lập các khung giờ làm việc chuẩn cho nhân viên.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-4 md:mt-0 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm font-medium"
        >
          <Plus size={20} /> Tạo Ca Mới
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-gray-500">
          <Loader2 className="animate-spin mr-2" /> Đang tải dữ liệu...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shifts.length === 0 && (
            <div className="col-span-full bg-white p-10 rounded-xl text-center border border-dashed border-gray-300">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Chưa có ca làm việc nào được tạo.</p>
              <button onClick={() => setIsModalOpen(true)} className="text-blue-600 font-medium mt-2 hover:underline">Tạo ngay</button>
            </div>
          )}

          {shifts.map((shift) => (
            <div key={shift.id} className="group bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                  <Briefcase size={24} />
                </div>
                <button
                  onClick={() => handleDelete(shift.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  title="Xóa ca"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{shift.name}</h3>

              <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                <span>Thời lượng: ~{calculateDuration(shift.startTime, shift.endTime)} tiếng</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between border border-gray-100">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase font-semibold">Bắt đầu</span>
                  <span className="text-gray-900 font-mono font-medium">{shift.startTime}</span>
                </div>
                <div className="text-gray-300">→</div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-500 uppercase font-semibold">Kết thúc</span>
                  <span className="text-gray-900 font-mono font-medium">{shift.endTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Thêm Ca Làm Việc</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên ca làm việc</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ca Hành Chính, Ca Sáng..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu</label>
                  <div className="relative">
                    <input
                      type="time"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.startTime}
                      onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giờ kết thúc</label>
                  <div className="relative">
                    <input
                      type="time"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.endTime}
                      onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
                >
                  <Save size={18} /> Lưu Ca Làm Việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};