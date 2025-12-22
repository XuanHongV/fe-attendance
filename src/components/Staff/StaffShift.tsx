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
  shift: Shift;
  status: string;
  location?: string;
  note?: string;
}

export const StaffShift = () => {
  const [shifts, setShifts] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  
  // State quản lý tháng hiện tại cho Calendar View
  const [currentDate, setCurrentDate] = useState(new Date());

  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const fetchMyShifts = async () => {
      if (!user?._id) return;

      try {
        setLoading(true);
        const response = await api.get(`/shift-assignments/user/${user._id}`);
        
        if (response.data && Array.isArray(response.data.data)) {
            setShifts(response.data.data);
        } else if (Array.isArray(response.data)) {
            setShifts(response.data);
        } else {
            setShifts([]);
        }
      } catch (err: any) {
        console.error("Lỗi tải lịch:", err);
        setError("Không thể tải lịch làm việc. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyShifts();
  }, [user]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Chưa cập nhật";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // --- LOGIC CHO CALENDAR VIEW ---
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

  const renderCalendar = () => {
    const { days, firstDay } = getDaysInMonth(currentDate);
    const daysArray = [];

    // Ô trống đầu tháng
    for (let i = 0; i < firstDay; i++) {
      daysArray.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-100"></div>);
    }

    // Các ngày trong tháng
    for (let d = 1; d <= days; d++) {
      const currentMonthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = d.toString().padStart(2, '0');
      const dateString = `${currentDate.getFullYear()}-${currentMonthStr}-${dayStr}`;

      const dayShifts = shifts.filter(s => s.work_date.startsWith(dateString));

      daysArray.push(
        <div key={d} className="min-h-[100px] border border-gray-100 p-1 hover:bg-gray-50 transition-colors bg-white">
          <div className={`text-right text-sm font-medium mb-1 ${
             new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), d).toDateString() 
             ? 'text-blue-600 font-bold' : 'text-gray-700'
          }`}>
            {d}
          </div>
          <div className="flex flex-col gap-1">
            {dayShifts.map(shift => (
              <div 
                key={shift._id} 
                className="text-[10px] p-1 rounded text-white truncate cursor-help"
                style={{ backgroundColor: shift.shift?.color_code || '#3b82f6' }}
                title={`${shift.shift.name}: ${shift.shift.start_time} - ${shift.shift.end_time}`}
              >
                {shift.shift.start_time} - {shift.shift.name}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return daysArray;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex justify-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
            Lịch làm việc của tôi
          </h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý ca làm việc và thời gian</p>
        </div>

        <div className="bg-gray-100 p-1 rounded-lg flex items-center">
            <button 
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'calendar' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                <CalendarIcon size={16} /> Lịch Tháng
            </button>
            <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'list' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                <List size={16} /> Chi Tiết Ca
            </button>
        </div>
      </div>
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
           {/* Thanh điều hướng tháng */}
           <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-200 rounded"><ChevronLeft /></button>
              <span className="font-bold text-gray-700 text-lg">
                Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}
              </span>
              <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-200 rounded"><ChevronRight /></button>
           </div>
           
           {/* Header Thứ */}
           <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
                  <div key={day} className="py-2 text-center text-sm font-semibold text-gray-500">{day}</div>
              ))}
           </div>

           <div className="grid grid-cols-7 bg-gray-200 gap-px border-b border-gray-200">
               {renderCalendar()}
           </div>
           
           <div className="p-3 text-xs text-gray-500 bg-gray-50">
              * Nhấn vào "Chi Tiết Ca" để xem địa điểm và ghi chú cụ thể.
           </div>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
             {shifts.length === 0 ? (
                <div className="bg-white p-16 rounded-2xl shadow-sm text-center border border-dashed border-gray-300">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Chưa có lịch làm việc</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shifts.map((item) => (
                    <div
                    key={item._id}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 overflow-hidden flex flex-col"
                    >
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-indigo-100 flex justify-between items-center">
                        <span className="font-bold text-indigo-900 capitalize text-sm">
                        {formatDate(item.work_date)}
                        </span>
                        
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-bold ${
                        item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        item.status === 'ABSENT' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                        }`}>
                        {item.status === 'ASSIGNED' ? 'Sắp tới' : item.status}
                        </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col gap-4">
                        <div>
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {item.shift?.name || "Ca chưa đặt tên"}
                        </h3>
                        <div 
                            className="h-1 w-12 rounded mt-2" 
                            style={{ backgroundColor: item.shift?.color_code || '#3b82f6' }}
                        ></div>
                        </div>

                        <div className="flex items-center text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <Clock className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" />
                        <span className="font-mono font-medium text-lg">
                            {item.shift?.start_time} - {item.shift?.end_time}
                        </span>
                        </div>

                        <div className="flex items-center text-gray-500 text-sm mt-auto pt-2">
                        <MapPin className="w-4 h-4 mr-2 text-red-500" />
                        <span className="truncate">{item.location || "Văn phòng chính"}</span>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}
        </div>
      )}
    </div>
  );
};