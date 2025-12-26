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
  ChevronRight 
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
  shift: Shift | null; // Cho phép null để tránh lỗi crash
  status: string;
  location?: string;
  note?: string;
}

export const StaffShift = () => {
  const [shifts, setShifts] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchMyShifts = async () => {
      if (!user?._id) return;
      try {
        setLoading(true);
        const response = await api.get(`/shift-assignments/user/${user._id}`);
        const data = response.data?.data || response.data || [];
        setShifts(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError("Không thể tải lịch làm việc. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchMyShifts();
  }, [user?._id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Chưa cập nhật";
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(new Date(dateString));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); 
    return { days, firstDay };
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const renderCalendar = () => {
    const { days, firstDay } = getDaysInMonth(currentDate);
    const daysArray = [];

    for (let i = 0; i < firstDay; i++) {
      daysArray.push(<div key={`empty-${i}`} className="h-28 bg-slate-50/50 border border-slate-100"></div>);
    }

    for (let d = 1; d <= days; d++) {
      const currentMonthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = d.toString().padStart(2, '0');
      const dateString = `${currentDate.getFullYear()}-${currentMonthStr}-${dayStr}`;

      // Thêm kiểm tra s.work_date an toàn
      const dayShifts = shifts.filter(s => s.work_date && s.work_date.startsWith(dateString));

      daysArray.push(
        <div key={d} className="min-h-[110px] border border-slate-100 p-2 hover:bg-blue-50/30 transition-all bg-white relative group">
          <div className={`text-right text-xs font-black mb-2 ${
             new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), d).toDateString() 
             ? 'text-blue-600' : 'text-slate-400'
          }`}>
            {d}
          </div>
          <div className="flex flex-col gap-1.5">
            {dayShifts.map(item => (
              <div 
                key={item._id} 
                className="text-[9px] p-1.5 rounded-lg text-white truncate font-bold shadow-sm"
                style={{ backgroundColor: item.shift?.color_code || '#6366f1' }}
                title={`${item.shift?.name}: ${item.shift?.start_time} - ${item.shift?.end_time}`}
              >
                {/* Sửa lỗi tại đây: Thêm optional chaining ?. */}
                {item.shift?.start_time || '??:??'} {item.shift?.name || 'N/A'}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return daysArray;
  };

  if (loading) return (
    <div className="p-20 flex flex-col items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-solid border-r-transparent"></div>
      <p className="mt-4 text-slate-400 font-black text-xs uppercase tracking-[0.2em]">Đang đồng bộ dữ liệu...</p>
    </div>
  );

  if (error) return (
    <div className="p-10 flex justify-center">
      <div className="bg-red-50 text-red-600 p-6 rounded-[2rem] border-2 border-red-100 flex items-center gap-4 shadow-xl shadow-red-100">
        <AlertCircle size={24} /> <span className="font-black uppercase text-xs tracking-widest">{error}</span>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <CalendarIcon className="w-10 h-10 text-blue-600 p-2 bg-blue-50 rounded-2xl" />
            Lịch Làm Việc
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 ml-1 opacity-60">Personal Schedule Management</p>
        </div>

        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center shadow-inner">
          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <CalendarIcon size={14} /> Lịch Tháng
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              viewMode === 'list' ? 'bg-white text-blue-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List size={14} /> Chi Tiết
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-slate-50 bg-slate-50/30">
            <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all text-slate-400 hover:text-blue-600"><ChevronLeft size={24}/></button>
            <span className="font-black text-slate-800 text-xl uppercase tracking-tighter">
              Tháng {currentDate.getMonth() + 1} <span className="text-blue-600">/</span> {currentDate.getFullYear()}
            </span>
            <button onClick={() => changeMonth(1)} className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all text-slate-400 hover:text-blue-600"><ChevronRight size={24}/></button>
          </div>
          
          <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
            {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-slate-100 gap-px">
            {renderCalendar()}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-10 duration-700">
          {shifts.length === 0 ? (
            <div className="col-span-full bg-white p-24 rounded-[3rem] text-center border-4 border-dashed border-slate-50">
              <CalendarIcon className="w-20 h-20 text-slate-100 mx-auto mb-6" />
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Hiện tại bạn chưa có lịch phân ca</p>
            </div>
          ) : (
            shifts.map((item) => (
              <div key={item._id} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-white p-8 group hover:-translate-y-2 transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div className="px-4 py-2 bg-blue-50 rounded-2xl text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-100">
                    {formatDate(item.work_date)}
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-tighter border-2 ${
                    item.status === 'COMPLETED' ? 'bg-green-50 text-green-600 border-green-100' : 
                    item.status === 'ABSENT' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {item.status === 'ASSIGNED' ? 'Sắp tới' : item.status}
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {item.shift?.name || "Ca chưa xác định"}
                </h3>
                
                <div className="flex items-center gap-3 text-slate-400 mb-8">
                  <MapPin size={14} className="text-red-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{item.location || "Văn phòng chính"}</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-700">
                    <Clock size={18} className="text-blue-500" />
                    <span className="font-black text-sm tracking-tight font-mono">
                      {item.shift?.start_time || '--:--'} - {item.shift?.end_time || '--:--'}
                    </span>
                  </div>
                  <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: item.shift?.color_code || '#cbd5e1' }} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};