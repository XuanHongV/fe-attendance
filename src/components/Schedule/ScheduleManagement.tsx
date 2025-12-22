import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import api from "../../services/apiService";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  AlertCircle, 
  List, 
  ChevronLeft, 
  ChevronRight,
  User,
  Search,
  Plus,
  X,
  Users,
  CalendarDays,
  FileText,
  Trash2,
  CheckCircle2,
  Info,
  ChevronRight as ChevronRightIcon,
  MessageSquare
} from "lucide-react";

interface Shift {
  _id: string;
  name: string;
  start_time: string;
  end_time: string;
  color_code?: string;
}

interface ShiftAssignment {
  _id: string;
  work_date: string;
  shift: Shift;
  status: string;
  location?: string;
  note?: string;
  user?: {
      _id: string;
      fullName: string;
      email?: string;
  }; 
}
interface SimpleUser {
    _id: string;
    fullName: string;
}

export const ScheduleManagement = () => {
  const [shifts, setShifts] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ShiftAssignment | null>(null);
  const [detailModal, setDetailModal] = useState<{ isOpen: boolean, assignments: ShiftAssignment[] }>({
      isOpen: false,
      assignments: []
  });
  
  const [selectedDateForAssign, setSelectedDateForAssign] = useState<string | null>(null);
  const [availableEmployees, setAvailableEmployees] = useState<SimpleUser[]>([]);
  const [availableShifts, setAvailableShifts] = useState<Shift[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [assignNote, setAssignNote] = useState<string>(''); 

  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const fetchData = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const fromDate = new Date(year, month, 1).toISOString().split('T')[0];
      const toDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const url = isAdmin 
        ? `/shift-assignments?from=${fromDate}&to=${toDate}` 
        : `/shift-assignments/user/${user._id}?from=${fromDate}&to=${toDate}`;
      
      const response = await api.get(url);
      const data = response.data?.data || response.data || [];
      const activeAssignments = data.filter((item: any) => item.shift !== null);
      setShifts(activeAssignments);
    } catch (err: any) {
      setError("Không thể tải dữ liệu lịch.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentDate, isAdmin, user?._id]);

  const fetchAssignData = async () => {
      if (!isAdmin) return;
      try {
          const companyId = typeof user?.company === 'string' ? user.company : (user?.company as any)?._id;
          if(companyId) {
             const [usersRes, shiftsRes] = await Promise.all([
                 api.get(`/users/company/id/${companyId}`),
                 api.get('/shifts')
             ]);
             const rawUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data || []);
             setAvailableEmployees(rawUsers.filter((u: any) => u.role === 'STAFF'));
             setAvailableShifts(shiftsRes.data);
          }
      } catch (err) { console.error(err); }
  };

  const handleAssignSubmit = async () => {
      if (!selectedDateForAssign || !selectedEmployeeId || !selectedShiftId) return alert("Vui lòng chọn đầy đủ!");
      try {
          await api.post('/shift-assignments', { 
            userId: selectedEmployeeId, 
            shiftId: selectedShiftId, 
            work_date: selectedDateForAssign,
            note: assignNote
          });
          setIsAssignModalOpen(false);
          setAssignNote(''); 
          fetchData();
      } catch (error: any) { alert("Lỗi khi phân ca"); }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!window.confirm("Hủy phân ca này?")) return;
    try {
      await api.delete(`/shift-assignments/${id}`);
      setSelectedAssignment(null);
      setDetailModal({ ...detailModal, isOpen: false });
      fetchData();
    } catch (err) { alert("Xóa thất bại"); }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); 
    const daysArray = [];

    for (let i = 0; i < firstDay; i++) {
      daysArray.push(<div key={`empty-${i}`} className="min-h-[120px] bg-gray-50/10 border-b border-r border-gray-100"></div>);
    }

    for (let d = 1; d <= days; d++) {
      const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      const dayAssignments = shifts.filter(s => s.work_date.startsWith(dateString));
      const groupedByShift = dayAssignments.reduce((acc, curr) => {
        const shiftName = curr.shift?.name || "Chưa đặt tên";
        if (!acc[shiftName]) acc[shiftName] = [];
        acc[shiftName].push(curr);
        return acc;
      }, {} as Record<string, ShiftAssignment[]>);

      const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();

      daysArray.push(
        <div key={d} onClick={() => isAdmin && (setSelectedDateForAssign(dateString), setIsAssignModalOpen(true), fetchAssignData())}
          className={`min-h-[120px] border-b border-r border-gray-100 p-2 transition-all bg-white relative ${isAdmin ? 'cursor-pointer hover:bg-slate-50' : ''} ${isToday ? 'bg-blue-50/30' : ''}`}>
          <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-2 ${isToday ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>{d}</span>
          <div className="space-y-1">
            {Object.entries(groupedByShift).map(([shiftName, assignments]) => (
              <button key={shiftName} onClick={(e) => { e.stopPropagation(); setDetailModal({ isOpen: true, assignments }); }}
                className="w-full flex items-center justify-between px-2 py-1 rounded-lg text-white transition-all hover:scale-[1.02] shadow-sm overflow-hidden"
                style={{ backgroundColor: assignments[0].shift?.color_code || '#3b82f6', borderLeft: '3px solid rgba(0,0,0,0.2)' }}>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Users size={10} className="shrink-0" />
                  <span className="text-[10px] font-bold truncate uppercase">{shiftName}</span>
                </div>
                <span className="bg-black/20 px-1 rounded text-[9px] font-black">{assignments.length}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }
    return daysArray;
  };

  const filteredShifts = shifts.filter(item => {
    const searchStr = searchTerm.toLowerCase();
    return (
      item.user?.fullName.toLowerCase().includes(searchStr) || 
      item.shift?.name.toLowerCase().includes(searchStr)
    );
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200/60">
            <div className="flex-1">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                   <CalendarIcon className="text-blue-600" /> {isAdmin ? "Điều Hành Nhân Sự" : "Lịch Làm Việc Cá Nhân"}
                </h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1 opacity-70">Shift Management System v2.0</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                {viewMode === 'list' && (
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Tìm nhân viên, ca..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                )}
                <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
                    <button onClick={() => setViewMode('calendar')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                        <CalendarIcon size={16} /> Lịch
                    </button>
                    <button onClick={() => setViewMode('list')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                        <List size={16} /> Danh sách
                    </button>
                </div>
            </div>
        </div>

        {loading ? (
           <div className="h-[400px] flex items-center justify-center bg-white rounded-[2.5rem] shadow-sm"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
        ) : (
          <>
            {viewMode === 'calendar' ? (
                <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    <div className="p-6 flex items-center justify-between border-b border-slate-50">
                        <h2 className="text-xl font-black text-slate-800 uppercase">Tháng {currentDate.getMonth() + 1} <span className="text-blue-600">/ {currentDate.getFullYear()}</span></h2>
                        <div className="flex gap-2 bg-slate-50 p-1 rounded-xl">
                            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600"><ChevronLeft size={20}/></button>
                            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-600"><ChevronRight size={20}/></button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="min-w-[800px] grid grid-cols-7 border-t border-slate-100 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 bg-slate-50/30">
                            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => <div key={day} className="py-4 text-center border-r border-slate-100 last:border-0">{day}</div>)}
                        </div>
                        <div className="min-w-[800px] grid grid-cols-7 border-t border-slate-100">{renderCalendar()}</div>
                    </div>
                </div>
            ) : (
                
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {filteredShifts.map((item) => (
                   <div key={item._id} onClick={() => setSelectedAssignment(item)} className="group bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 transition-all cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: item.shift?.color_code }}></div>
                      <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{new Date(item.work_date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}</p>
                            <h3 className="font-black text-slate-800 text-lg uppercase leading-tight">{item.shift?.name}</h3>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:text-blue-600 transition-colors"><ChevronRightIcon size={18}/></div>
                      </div>
                      <div className="pt-4 border-t border-slate-50 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-[10px] font-black uppercase">{item.user?.fullName?.charAt(0)}</div>
                          <p className="text-xs font-black text-slate-800 truncate">{item.user?.fullName}</p>
                      </div>
                   </div>
                ))}
              </div>
            )}
          </>
        )}

        {detailModal.isOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in zoom-in duration-200">
                <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
                    <div className="relative p-8 text-white" style={{ backgroundColor: detailModal.assignments[0]?.shift?.color_code || '#3b82f6' }}>
                        <button onClick={() => setDetailModal({ isOpen: false, assignments: [] })} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-md"><Users size={32} /></div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">{detailModal.assignments[0]?.shift?.name}</h3>
                                <div className="flex items-center gap-2 opacity-90 text-sm font-bold"><Clock size={14} /><span>{detailModal.assignments[0]?.shift?.start_time} - {detailModal.assignments[0]?.shift?.end_time}</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 bg-slate-50/50">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 block">Nhân sự thực hiện ({detailModal.assignments.length})</span>
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                            {detailModal.assignments.map((item, index) => (
                                <div key={item._id} onClick={() => setSelectedAssignment(item)} className="group flex items-center justify-between p-4 bg-white rounded-3xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all cursor-pointer animate-in slide-in-from-bottom" style={{ animationDelay: `${index * 50}ms` }}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-black shadow-inner">{item.user?.fullName?.charAt(0)}</div>
                                        <h4 className="font-black text-gray-800 text-sm">{item.user?.fullName}</h4>
                                    </div>
                                    <ChevronRightIcon size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {selectedAssignment && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-4">
                           <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl"><Info size={24} /></div>
                           <div>
                               <h3 className="font-black text-xl text-slate-900 tracking-tight">Chi Tiết Công Tác</h3>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ID: #{selectedAssignment._id.slice(-8).toUpperCase()}</p>
                           </div>
                        </div>
                        <button onClick={() => setSelectedAssignment(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all"><X size={24} className="text-slate-400" /></button>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <section>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3"><User size={12}/> Nhân viên</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg">{selectedAssignment.user?.fullName?.charAt(0)}</div>
                                    <div><h4 className="font-black text-slate-800 text-base">{selectedAssignment.user?.fullName}</h4><p className="text-xs text-slate-500 font-medium">{selectedAssignment.user?.email || 'N/A'}</p></div>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-6">
                            <section>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3"><MapPin size={12}/> Địa điểm & Ghi chú</label>
                                <div className="space-y-4 p-4 bg-orange-50/30 rounded-[2rem] border border-orange-100">
                                    <div className="flex items-start gap-3"><MapPin size={14} className="text-orange-500 mt-0.5"/><p className="text-xs font-bold text-slate-700">{selectedAssignment.location || "Văn phòng chính"}</p></div>
                                    {/* HIỂN THỊ NOTE TỪ BACKEND */}
                                    <div className="flex items-start gap-3"><FileText size={14} className="text-orange-500 mt-0.5"/><p className="text-[11px] text-slate-500 italic font-medium leading-relaxed">{selectedAssignment.note || "Không có ghi chú đặc biệt."}</p></div>
                                </div>
                            </section>
                        </div>
                    </div>

                    <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-between">
                        <button onClick={() => setSelectedAssignment(null)} className="px-8 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-600 font-black hover:bg-slate-100 transition-all text-[11px] uppercase tracking-widest">Đóng</button>
                        {isAdmin && <button onClick={() => handleDeleteAssignment(selectedAssignment._id)} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-red-50 text-red-600 rounded-2xl font-black hover:bg-red-600 hover:text-white transition-all text-[11px] uppercase tracking-widest"><Trash2 size={14}/> Hủy Phân Ca</button>}
                    </div>
                </div>
            </div>
        )}

        {isAssignModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-xl text-slate-900 tracking-tight">Phân Ca Làm Việc</h3>
                <button onClick={() => setIsAssignModalOpen(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-red-500 shadow-sm border border-slate-200"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nhân viên</label>
                  <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold" value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
                    <option value="">Chọn nhân viên...</option>
                    {availableEmployees.map(emp => <option key={emp._id} value={emp._id}>{emp.fullName}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ca làm</label>
                  <select className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-bold" value={selectedShiftId} onChange={(e) => setSelectedShiftId(e.target.value)}>
                    <option value="">Chọn ca...</option>
                    {availableShifts.map(s => <option key={s._id} value={s._id}>{s.name} ({s.start_time}-{s.end_time})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <MessageSquare size={12}/> Ghi chú phân ca
                  </label>
                  <textarea 
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium resize-none min-h-[80px]" 
                    placeholder="Nhập ghi chú hoặc yêu cầu cụ thể cho nhân viên..."
                    value={assignNote}
                    onChange={(e) => setAssignNote(e.target.value)}
                  />
                </div>

                <button onClick={handleAssignSubmit} className="w-full py-4 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all uppercase tracking-widest text-xs mt-2">Xác nhận</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};