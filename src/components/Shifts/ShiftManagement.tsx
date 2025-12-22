import React, { useState, useEffect, FormEvent } from 'react';
import { 
  Plus, Clock, Trash2, Edit, Save, X, Briefcase, 
  Loader2, Palette, Settings2, ShieldAlert, Timer, 
  MapPin, ChevronDown 
} from 'lucide-react';
import api from '../../services/apiService';

enum ShiftType {
  PARTTIME = 'PARTTIME',
  FULLTIME = 'FULLTIME',
}

interface Position {
  _id: string;
  name: string;
}

interface Shift {
  _id: string;
  name: string;
  start_time: string;
  end_time: string;
  allowance: number;
  color_code: string;
  type: ShiftType;
  position?: string | Position; 
  check_allowed_time: number;
  check_in_duration: number;
  check_out_allowed_time: number;
  standard_working_hours: number;
  late_penalty_amount: number;
}

export const ShiftManagement = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [positions, setPositions] = useState<Position[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm = {
    name: '',
    start_time: '08:00',
    end_time: '17:00',
    allowance: 0,
    color_code: '#3b82f6',
    type: ShiftType.FULLTIME,
    position: '', 
    check_allowed_time: 15,
    check_in_duration: 30,
    check_out_allowed_time: 15,
    standard_working_hours: 8,
    late_penalty_amount: 0,
  };

  const [formData, setFormData] = useState(initialForm);
  useEffect(() => {
    const calculateHours = () => {
      if (!formData.start_time || !formData.end_time) return;
      const [sH, sM] = formData.start_time.split(':').map(Number);
      const [eH, eM] = formData.end_time.split(':').map(Number);
      const startTotal = sH * 60 + (sM || 0);
      let endTotal = eH * 60 + (eM || 0);
      if (endTotal <= startTotal) endTotal += 1440;
      const hours = parseFloat(((endTotal - startTotal) / 60).toFixed(2));
      if (hours !== formData.standard_working_hours) {
        setFormData(prev => ({ ...prev, standard_working_hours: hours }));
      }
    };
    calculateHours();
  }, [formData.start_time, formData.end_time]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shiftsRes, positionsRes] = await Promise.all([
        api.get('/shifts'),
        api.get('/positions')
      ]);
      setShifts(Array.isArray(shiftsRes.data) ? shiftsRes.data : shiftsRes.data?.data || []);
      setPositions(Array.isArray(positionsRes.data) ? positionsRes.data : positionsRes.data?.data || []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = (shift?: any) => {
    if (shift) {
      setEditingId(shift._id || shift.id);
      setFormData({
        name: shift.name || '',
        start_time: shift.start_time || '08:00',
        end_time: shift.end_time || '17:00',
        allowance: shift.allowance ?? 0,
        color_code: shift.color_code || '#3b82f6',
        type: shift.type || ShiftType.FULLTIME,
        position: typeof shift.position === 'object' ? (shift.position?._id || '') : (shift.position || ''), 
        check_allowed_time: shift.check_allowed_time ?? 15,
        check_in_duration: shift.check_in_duration ?? 30,
        check_out_allowed_time: shift.check_out_allowed_time ?? 15,
        standard_working_hours: shift.standard_working_hours ?? 8,
        late_penalty_amount: shift.late_penalty_amount ?? 0,
      });
    } else {
      setEditingId(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { ...payload } = formData;
      if (!payload.position) {
        // @ts-ignore
        delete payload.position;
      }

      if (editingId) {
        await api.patch(`/shifts/${editingId}`, payload);
      } else {
        await api.post('/shifts', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      const message = error.response?.data?.message;
      alert(Array.isArray(message) ? message[0] : (message || "Có lỗi xảy ra"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#F8FAFC] min-h-screen font-sans">
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Clock className="text-blue-600" size={32} /> Cấu Hình Ca Làm Việc
          </h2>
          <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-[0.2em] opacity-70">Shift Management System v2.0</p>
        </div>
        <button onClick={() => handleOpenModal()} className="bg-blue-600 text-white px-8 py-4 rounded-[1.5rem] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 font-black text-xs uppercase tracking-widest active:scale-95">
          <Plus size={18} className="inline mr-2" /> Tạo Ca Mới
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shifts.map((shift: any) => (
            <div key={shift._id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: shift.color_code }}></div>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-3xl flex items-center justify-center text-white font-black shadow-lg shrink-0" style={{ backgroundColor: shift.color_code }}>
                    {shift.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-slate-800 text-lg leading-tight truncate">{shift.name}</h3>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-widest">{shift.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(shift)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit size={18} /></button>
                  <button onClick={() => {if(window.confirm("Xóa ca này?")) api.delete(`/shifts/${shift._id}`).then(()=>fetchData())}} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Giờ làm</p>
                  <p className="text-sm font-black text-slate-700">{shift.start_time}-{shift.end_time}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lương/Ca</p>
                  <p className="text-sm font-black text-green-600">{(shift.allowance || 0).toLocaleString()}đ</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transition-all border border-white/20 transform scale-100">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingId ? 'Chỉnh Sửa Ca' : 'Cấu Hình Ca Mới'}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Trạng thái: {editingId ? 'Cập nhật' : 'Khởi tạo'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="font-black uppercase tracking-[0.2em] text-[10px] text-blue-600 border-b border-blue-50 pb-2 flex items-center gap-2">
                    <Briefcase size={14}/> Thông tin hệ thống
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Tên Ca trực</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-black text-slate-700" placeholder="VD: Ca Sáng" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Vị trí</label>
                    <div className="relative">
                      <select value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black text-slate-700 outline-none border-2 border-transparent focus:border-blue-500 appearance-none transition-all">
                        <option value="">-- Tất cả vị trí --</option>
                        {positions.map(pos => <option key={pos._id} value={pos._id}>{pos.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-2">Phụ cấp ca làm (VNĐ)</label>
                    <input type="number" value={formData.allowance} onChange={(e) => setFormData({...formData, allowance: Number(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black text-green-600 border-2 border-transparent focus:border-green-500 outline-none transition-all" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="font-black uppercase tracking-[0.2em] text-[10px] text-orange-600 border-b border-orange-50 pb-2 flex items-center gap-2">
                    <Clock size={14}/> Thời gian làm việc
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Bắt đầu</label>
                      <input type="time" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} className="w-full px-4 py-4 bg-slate-50 rounded-2xl font-black text-center outline-none border-2 border-transparent focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Kết thúc</label>
                      <input type="time" value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} className="w-full px-4 py-4 bg-slate-50 rounded-2xl font-black text-center outline-none border-2 border-transparent focus:border-blue-500" />
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex justify-between items-center">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Tự động tính toán:</span>
                    <span className="text-sm font-black text-blue-700">{formData.standard_working_hours} h</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Vào sớm (p)</label>
                      <input type="number" value={formData.check_allowed_time} onChange={(e) => setFormData({...formData, check_allowed_time: Number(e.target.value)})} className="w-full px-4 py-4 bg-slate-50 rounded-2xl font-black" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Màu nhận diện</label>
                      <input type="color" value={formData.color_code} onChange={(e) => setFormData({...formData, color_code: e.target.value})} className="w-full h-[58px] p-2 bg-slate-50 rounded-2xl cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex flex-col md:flex-row gap-4 border-t border-slate-50 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black hover:bg-slate-200 transition-all uppercase tracking-[0.2em] text-[10px]">Hủy bỏ</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black hover:bg-blue-700 shadow-xl shadow-blue-100 disabled:opacity-50 flex justify-center items-center gap-2 uppercase tracking-[0.2em] text-[10px]">
                  {isSubmitting && <Loader2 className="animate-spin" size={16}/>}
                  {editingId ? 'Cập nhật hệ thống' : 'Lưu vào hệ thống'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};