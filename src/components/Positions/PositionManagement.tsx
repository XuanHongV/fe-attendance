import React, { useState, useEffect, FormEvent } from 'react';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  DollarSign, 
  MoreHorizontal
} from 'lucide-react';
import api from '../../services/apiService';

// 1. Cập nhật Interface khớp với DTO Backend
interface Position {
  _id: string;
  code: string;        // Khớp DTO
  name: string;        // Khớp DTO
  hourlyRate: number;  // Khớp DTO (thay vì baseSalary)
  isActive: boolean;   // Khớp DTO
}

export const PositionManagement = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  
  // 2. Cập nhật State Form khớp DTO
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    hourlyRate: 0, // Dùng hourlyRate
    isActive: true
  });

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const response = await api.get('/positions');
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setPositions(data);
    } catch (error) {
      console.error("Lỗi tải danh sách chức vụ:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleOpenModal = (position?: Position) => {
    if (position) {
      setEditingPosition(position);
      setFormData({
        code: position.code,
        name: position.name,
        hourlyRate: position.hourlyRate || 0, // Map dữ liệu cũ
        isActive: position.isActive
      });
    } else {
      setEditingPosition(null);
      setFormData({
        code: '',
        name: '',
        hourlyRate: 0,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chức vụ này?")) return;
    try {
      await api.delete(`/positions/${id}`);
      setPositions(prev => prev.filter(p => p._id !== id));
    } catch (error: any) {
      alert(error.response?.data?.message || "Lỗi khi xóa chức vụ");
    }
  };

  // 3. Sửa hàm Submit để gửi đúng Payload
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // CHUẨN BỊ PAYLOAD KHỚP DTO
      const payload = {
        code: formData.code.trim().toUpperCase(), // Backend cần string
        name: formData.name.trim(),               // Backend cần string
        hourlyRate: Number(formData.hourlyRate),  // QUAN TRỌNG: Ép kiểu Number
        isActive: Boolean(formData.isActive)      // Backend cần boolean
        // Lưu ý: Không gửi description vì DTO không có
      };

      if (editingPosition) {
        await api.patch(`/positions/${editingPosition._id}`, payload);
        alert("Cập nhật thành công!");
      } else {
        await api.post('/positions', payload);
        alert("Thêm mới thành công!");
      }
      
      setIsModalOpen(false);
      fetchPositions(); 
    } catch (error: any) {
      console.error("Lỗi lưu:", error);
      const errorData = error.response?.data;
      if (errorData && Array.isArray(errorData.message)) {
          alert(`Lỗi dữ liệu:\n- ${errorData.message.join('\n- ')}`);
      } else {
          alert(errorData?.message || "Có lỗi xảy ra");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const filteredPositions = positions.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="w-8 h-8 text-blue-600" />
            Quản lý Chức vụ
          </h1>
          <p className="text-gray-500 text-sm mt-1">Thiết lập các vị trí và mức lương theo giờ.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus size={18} /> Thêm Chức vụ
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm chức vụ..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPositions.map((item) => (
          <div key={item._id} className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col">
            <div className="p-5 border-b border-gray-50 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg leading-tight">{item.name}</h3>
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                    {item.code}
                  </span>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-1"><MoreHorizontal size={20} /></button>
            </div>

            <div className="p-5 flex-1 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <DollarSign size={16} /> Lương theo giờ
                </span>
                <span className="font-bold text-gray-900 bg-green-50 text-green-700 px-2 py-1 rounded">
                  {formatCurrency(item.hourlyRate || 0)}/h
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-gray-50 bg-gray-50/50 rounded-b-xl flex justify-between items-center gap-3">
               <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                 {item.isActive ? 'Hoạt động' : 'Đã khóa'}
               </span>
               <div className="flex gap-2">
                 <button onClick={() => handleOpenModal(item)} className="p-2 bg-white border border-gray-200 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                    <Edit size={16} />
                 </button>
                 <button onClick={() => handleDelete(item._id)} className="p-2 bg-white border border-gray-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                 </button>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">
                {editingPosition ? 'Cập nhật Chức vụ' : 'Thêm Chức vụ Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Tên Chức vụ <span className="text-red-500">*</span></label>
                  <input 
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">Mã Chức vụ <span className="text-red-500">*</span></label>
                  <input 
                    type="text" required
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Lương theo giờ (Hourly Rate) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₫</span>
                  <input 
                    type="number" min="0" required
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({...formData, hourlyRate: Number(e.target.value)})}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer select-none">Đang kích hoạt</label>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex justify-center items-center gap-2 disabled:opacity-70">
                  {isSubmitting && <Loader2 className="animate-spin w-4 h-4" />}
                  {editingPosition ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};