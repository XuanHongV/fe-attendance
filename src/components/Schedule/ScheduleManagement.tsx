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
  Filter,
  MoreHorizontal
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
  }; 
}

interface SimpleUser {
    _id: string;
    fullName: string;
    email: string;
}

export const ScheduleManagement = () => {
  // --- STATE MANAGEMENT ---
  const [shifts, setShifts] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedDateForAssign, setSelectedDateForAssign] = useState<string | null>(null);
  const [availableEmployees, setAvailableEmployees] = useState<SimpleUser[]>([]);
  const [availableShifts, setAvailableShifts] = useState<Shift[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  useEffect(() => {

    const fetchData = async () => {
      if (!user?._id) return;
      setLoading(true);
      try {
        let response;
        if (isAdmin) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const fromDate = new Date(year, month, 1).toISOString().split('T')[0];
            const toDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
            response = await api.get(`/shift-assignments?from=${fromDate}&to=${toDate}`);
        } else {
            response = await api.get(`/shift-assignments/user/${user._id}`);
        }
        
        const data = response.data?.data || response.data || [];
        setShifts(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("Lỗi tải lịch:", err);
        setError("Không thể tải dữ liệu lịch. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, currentDate, isAdmin]);

  const fetchAssignData = async () => {
      if (!isAdmin) return;
      try {
          const companyId = typeof user.company === 'string' ? user.company : (user.company as any)?._id;
          if(companyId) {
             const [usersRes, shiftsRes] = await Promise.all([
                 api.get(`/users/company/id/${companyId}`),
                 api.get('/shifts')
             ]);
             const rawUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data?.data || []);
             setAvailableEmployees(rawUsers.filter((u: any) => u.role === 'STAFF'));
             setAvailableShifts(shiftsRes.data);
          }
      } catch (err) {
          console.error("Lỗi tải dữ liệu phân ca:", err);
      }
  };

  // --- HELPER FUNCTIONS ---
  const formatDate = (dateString: string) => {
    if (!dateString) return "--/--";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(date);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); 
    return { days, firstDay };
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
  };

  const handleDayClick = (day: number) => {
      if (!isAdmin) return;
      const currentMonthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      setSelectedDateForAssign(`${currentDate.getFullYear()}-${currentMonthStr}-${dayStr}`);
      setIsAssignModalOpen(true);
      setSelectedEmployeeId('');
      setSelectedShiftId('');
      if (availableEmployees.length === 0) fetchAssignData();
  };

  const handleAssignSubmit = async () => {
      if (!selectedDateForAssign || !selectedEmployeeId || !selectedShiftId) {
          alert("Vui lòng chọn đầy đủ thông tin!");
          return;
      }
      try {
          await api.post('/shift-assignments', {
              userId: selectedEmployeeId,
              shiftId: selectedShiftId,
              work_date: selectedDateForAssign
          });
          alert("Phân ca thành công!");
          setIsAssignModalOpen(false);
          setCurrentDate(new Date(currentDate)); 
      } catch (error: any) {
          const msg = error.response?.data?.message || "Có lỗi xảy ra";
          alert(Array.isArray(msg) ? msg[0] : msg);
      }
  };

  // --- RENDERERS ---
  const renderCalendar = () => {
    const { days, firstDay } = getDaysInMonth(currentDate);
    const daysArray = [];

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(<div key={`empty-${i}`} className="min-h-[100px] bg-gray-50/50 border-b border-r border-gray-100"></div>);
    }

    // Day cells
    for (let d = 1; d <= days; d++) {
      const currentMonthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = d.toString().padStart(2, '0');
      const dateString = `${currentDate.getFullYear()}-${currentMonthStr}-${dayStr}`;
      const dayShifts = shifts.filter(s => s.work_date.startsWith(dateString));
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), d).toDateString();

      daysArray.push(
        <div 
            key={d} 
            onClick={() => handleDayClick(d)}
            className={`min-h-[120px] border-b border-r border-gray-100 p-2 transition-all relative group bg-white
                ${isAdmin ? 'cursor-pointer hover:bg-blue-50/50' : ''}
                ${isToday ? 'bg-blue-50/30' : ''}
            `}
        >
          <div className="flex justify-between items-start mb-2">
              <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700'
              }`}>
                {d}
              </span>
              {isAdmin && (
                  <button className="text-gray-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <Plus size={16} />
                  </button>
              )}
          </div>
          
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[80px] custom-scrollbar">
            {dayShifts.map(shift => (
              <div 
                key={shift._id} 
                className="text-xs px-2 py-1 rounded-md text-white shadow-sm flex items-center gap-1 truncate hover:opacity-90 transition-opacity"
                style={{ backgroundColor: shift.shift?.color_code || '#3b82f6' }}
                title={`${shift.shift.name} - ${shift.user?.fullName || 'NV'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white/50 shrink-0"></div>
                <span className="truncate">
                    {(isAdmin && shift.user) 
                        ? `${shift.user.fullName.split(' ').pop()} - ${shift.shift.name}`
                        : shift.shift.name
                    }
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return daysArray;
  };

  if (loading && shifts.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 text-sm animate-pulse">Đang tải lịch làm việc...</p>
        </div>
    </div>
  );

  if (error) return (
    <div className="p-8 flex justify-center">
        <div className="bg-red-50 text-red-600 px-6 py-4 rounded-xl border border-red-100 flex items-center gap-3 shadow-sm">
            <AlertCircle size={24} /> 
            <div>
                <h4 className="font-bold">Đã xảy ra lỗi</h4>
                <p className="text-sm opacity-90">{error}</p>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200/60">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    {/* <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <CalendarIcon size={28} />
                    </div> */}
                    {isAdmin ? "Quản Lý Lịch Làm Việc" : "Lịch Cá Nhân"}
                </h1>
                <p className="text-gray-500 mt-2 pl-1">
                    {isAdmin 
                        ? "Theo dõi và phân công lịch làm việc cho toàn bộ nhân sự" 
                        : "Theo dõi các ca làm việc sắp tới của bạn"
                    }
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                {/* Search Bar (Chỉ hiện khi List View) */}
                {viewMode === 'list' && (
                    <div className="relative group w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                )}

                {/* View Switcher */}
                <div className="flex bg-gray-100/80 p-1.5 rounded-xl self-start sm:self-auto">
                    <button 
                        onClick={() => setViewMode('calendar')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            viewMode === 'calendar' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        <CalendarIcon size={16} /> <span className="hidden sm:inline">Lịch Tháng</span>
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                            viewMode === 'list' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                        }`}
                    >
                        <List size={16} /> <span className="hidden sm:inline">Danh Sách</span>
                    </button>
                </div>
            </div>
        </div>

        {/* --- MAIN CONTENT --- */}
        
        {/* VIEW 1: CALENDAR (RESPONSIVE GRID) */}
        {viewMode === 'calendar' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Calendar Navigation */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-gray-800 capitalize">
                            Tháng {currentDate.getMonth() + 1}, <span className="text-gray-400">{currentDate.getFullYear()}</span>
                        </span>
                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 p-0.5">
                            <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600"><ChevronLeft size={20}/></button>
                            <div className="w-px h-4 bg-gray-200 mx-1"></div>
                            <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600"><ChevronRight size={20}/></button>
                        </div>
                    </div>
                    {/* Legend */}
                    {/* <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Ca Hành chính</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Ca Tối</div>
                    </div> */}
                </div>

                {/* Calendar Grid Container (Scrollable on mobile) */}
                <div className="overflow-x-auto">
                    <div className="min-w-[800px] lg:min-w-0">
                        {/* Days Header */}
                        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/50">
                            {['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map((day, idx) => (
                                <div key={day} className={`py-3 text-center text-xs font-bold uppercase tracking-wider ${idx === 0 || idx === 6 ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 bg-gray-100 gap-px border-b border-gray-200">
                            {renderCalendar()}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* VIEW 2: LIST DETAILED (MODERN CARDS) */}
        {viewMode === 'list' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {shifts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center bg-white p-12 rounded-2xl border-2 border-dashed border-gray-200 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <CalendarIcon className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Không tìm thấy lịch làm việc</h3>
                        <p className="text-gray-500 mt-1">Chưa có ca làm việc nào trong khoảng thời gian này.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {shifts.filter(item => {
                            if(!searchTerm) return true;
                            const searchStr = searchTerm.toLowerCase();
                            return item.user?.fullName.toLowerCase().includes(searchStr) || item.shift?.name.toLowerCase().includes(searchStr);
                        }).map((item) => (
                            <div key={item._id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col relative">
                                {/* Admin Badge */}
                                {isAdmin && item.user && (
                                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-gray-900/90 text-white text-xs px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm">
                                        <User size={12} className="text-blue-300" /> {item.user.fullName}
                                    </div>
                                )}
                                
                                {/* Color Stripe */}
                                <div className="h-1.5 w-full" style={{ backgroundColor: item.shift?.color_code || '#3b82f6' }}></div>

                                <div className="p-5 flex flex-col gap-4 flex-1">
                                    {/* Date Header */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ngày làm việc</span>
                                            <span className="text-lg font-bold text-gray-800 capitalize mt-0.5 flex items-center gap-2">
                                                {formatDate(item.work_date)}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${
                                            item.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                                            item.status === 'ABSENT' ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {item.status === 'ASSIGNED' ? 'Sắp tới' : item.status}
                                        </span>
                                    </div>

                                    {/* Shift Info */}
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 group-hover:bg-blue-50/50 group-hover:border-blue-100 transition-colors">
                                        <h3 className="font-bold text-gray-900 text-lg mb-1">{item.shift?.name || "Ca chưa đặt tên"}</h3>
                                        <div className="flex items-center gap-4 text-sm mt-3">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Clock size={16} className="text-blue-500"/>
                                                <span className="font-medium font-mono">{item.shift?.start_time} - {item.shift?.end_time}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Location Footer */}
                                    <div className="mt-auto pt-2 flex items-center gap-2 text-sm text-gray-500">
                                        <MapPin size={16} className="text-red-400" />
                                        <span className="truncate">{item.location || "Văn phòng chính"}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* --- ASSIGN MODAL (ADMIN) --- */}
        {isAssignModalOpen && (
            <div className="fixed inset-0 bg-gray-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="font-bold text-xl text-gray-900">Phân Ca Làm Việc</h3>
                            <p className="text-sm text-gray-500 mt-0.5">Cho ngày <span className="font-bold text-blue-600">{selectedDateForAssign}</span></p>
                        </div>
                        <button onClick={() => setIsAssignModalOpen(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm border border-gray-200">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        {/* Employee Select */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <User size={16} /> Chọn Nhân viên
                            </label>
                            <div className="relative">
                                <select 
                                    className="w-full appearance-none border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 pr-8 focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all font-medium text-gray-700"
                                    value={selectedEmployeeId}
                                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                >
                                    <option value="">-- Vui lòng chọn --</option>
                                    {availableEmployees.map(emp => (
                                        <option key={emp._id} value={emp._id}>{emp.fullName}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <ChevronRight size={16} className="rotate-90" />
                                </div>
                            </div>
                        </div>

                        {/* Shift Select */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Clock size={16} /> Chọn Ca làm việc
                            </label>
                            <div className="grid grid-cols-1 gap-2.5 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                                {availableShifts.map(shift => (
                                    <div 
                                        key={shift._id}
                                        onClick={() => setSelectedShiftId(shift._id)}
                                        className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all relative overflow-hidden group ${
                                            selectedShiftId === shift._id 
                                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="w-1.5 h-full absolute left-0 top-0" style={{ backgroundColor: shift.color_code || '#ccc' }}></div>
                                        <div className="pl-2 flex-1">
                                            <div className="font-bold text-gray-800 text-sm">{shift.name}</div>
                                            <div className="text-xs font-mono text-gray-500 mt-0.5">{shift.start_time} - {shift.end_time}</div>
                                        </div>
                                        {selectedShiftId === shift._id && (
                                            <div className="bg-blue-600 text-white p-1 rounded-full animate-in zoom-in">
                                                <Plus size={12} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                        <button 
                            onClick={() => setIsAssignModalOpen(false)}
                            className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-100 hover:text-gray-800 transition-colors shadow-sm"
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            onClick={handleAssignSubmit}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Xác nhận Phân Ca
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};