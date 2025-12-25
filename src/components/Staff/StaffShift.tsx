import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import api from '../../services/apiService';
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    AlertCircle,
    List,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Info,
} from 'lucide-react';
import { ModalAssignmentDetail } from '../../modal/modal-assignment-detail';
import { WeeklyCalendarView } from '../Schedule/weekly-calendar-view';
// import { WeeklyCalendarView } from './weekly-calendar-view';

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
    const [viewMode, setViewMode] = useState<'calendar' | 'weekly' | 'list'>('calendar');
    const [error, setError] = useState<string | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<ShiftAssignment | null>(
        null
    );
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const handleOpenDetail = (assignment: ShiftAssignment) => {
        setSelectedAssignment(assignment);
        setIsDetailModalOpen(true);
    };

    // const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');  
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
                console.error('Lỗi tải lịch:', err);
                setError('Không thể tải lịch làm việc. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };
        fetchMyShifts();
    }, [user]);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Chưa cập nhật';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(date);
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + offset,
            1
        );
        setCurrentDate(newDate);
    };

    const renderCalendar = () => {
        const { days, firstDay } = getDaysInMonth(currentDate);
        const daysArray = [];

        for (let i = 0; i < firstDay; i++) {
            daysArray.push(
                <div
                    key={`empty-${i}`}
                    className='h-24 bg-slate-50/30 border border-slate-100/50'
                ></div>
            );
        }

        for (let d = 1; d <= days; d++) {
            const currentMonthStr = (currentDate.getMonth() + 1)
                .toString()
                .padStart(2, '0');
            const dayStr = d.toString().padStart(2, '0');
            const dateString = `${currentDate.getFullYear()}-${currentMonthStr}-${dayStr}`;
            const dayShifts = shifts.filter((s) => s.work_date.startsWith(dateString));
            const isToday =
                new Date().toDateString() ===
                new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    d
                ).toDateString();

            daysArray.push(
                <div
                    key={d}
                    className='min-h-[90px] border border-slate-100 p-1.5 hover:bg-indigo-50/50 transition-all bg-white relative group'
                >
                    <div className='flex justify-end mb-1 relative z-10'>
                        <span
                            className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                                isToday
                                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-300 ring-2 ring-indigo-50'
                                    : 'text-slate-400 group-hover:text-indigo-600'
                            }`}
                        >
                            {d}
                        </span>
                    </div>
                    <div className='flex flex-col gap-1 relative z-10'>
                        {dayShifts.map((shift) => (
                            <div
                                onClick={() => handleOpenDetail(shift)}
                                key={shift._id}
                                className='flex items-center gap-1 text-[10px] font-black p-1 rounded-md text-white shadow-sm transform hover:translate-x-1 transition-all cursor-pointer border border-white/10 group/item'
                                style={{
                                    backgroundColor: shift.shift?.color_code || '#4f46e5',
                                    boxShadow: `0 2px 4px -1px ${shift.shift?.color_code}44`,
                                }}
                                title={`${shift.shift.name}: ${shift.shift.start_time} - ${shift.shift.end_time}`}
                            >
                                <span className='shrink-0 bg-white/20 px-1 rounded-sm'>
                                    {shift.shift.start_time}
                                </span>
                                <span className='opacity-50 font-light'>-</span>
                                <span className='truncate opacity-90 tracking-tighter'>
                                    {shift.shift.name}
                                </span>
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
            <div className='p-10 flex flex-col justify-center items-center min-h-[300px]'>
                <div className='animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600'></div>
                <p className='text-indigo-900 mt-4 font-bold uppercase tracking-widest text-[10px] animate-pulse'>
                    Đồng bộ dữ liệu...
                </p>
            </div>
        );
    }

    return (
        <div className='p-4 max-w-7xl mx-auto font-sans text-slate-900 selection:bg-indigo-100'>
            {/* Header Section - Thu gọn padding và font size */}
            <div className='flex flex-col lg:flex-row justify-between items-center mb-5 gap-4 bg-gradient-to-br from-white to-slate-50 p-4 rounded-2xl shadow-lg shadow-slate-200/50 border border-white'>
                <div className='flex items-center gap-4'>
                    <div className='p-2.5 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-200 text-white'>
                        <CalendarIcon size={22} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className='text-lg font-black text-slate-800 tracking-tight'>
                            Lịch làm việc của tôi
                        </h1>
                        <p className='text-slate-400 text-[10px] font-bold uppercase tracking-widest'>
                            Dashboard Nhân Viên
                        </p>
                    </div>
                </div>

                <div className='bg-slate-100 p-1 rounded-xl flex items-center shadow-inner border border-white'>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                            viewMode === 'calendar'
                                ? 'bg-white text-indigo-600 shadow-md'
                                : 'text-slate-400 hover:text-indigo-400'
                        }`}
                    >
                        <CalendarIcon size={14} strokeWidth={2.5} /> LỊCH THÁNG
                    </button>
                    <button
                        onClick={() => setViewMode('weekly')}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                            viewMode === 'weekly'
                                ? 'bg-white text-indigo-600 shadow-md'
                                : 'text-slate-400'
                        }`}
                    >
                        <Clock size={14} /> TUẦN
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                            viewMode === 'list'
                                ? 'bg-white text-indigo-600 shadow-md'
                                : 'text-slate-400 hover:text-indigo-400'
                        }`}
                    >
                        <List size={14} strokeWidth={2.5} /> DANH SÁCH
                    </button>
                </div>
            </div>

            {error && (
                <div className='mb-4 bg-rose-50 text-rose-600 p-3 rounded-xl border-2 border-rose-100 flex items-center gap-3 shadow-lg shadow-rose-100'>
                    <AlertCircle size={18} strokeWidth={2.5} />
                    <span className='font-black text-[10px] uppercase tracking-wide'>
                        {error}
                    </span>
                </div>
            )}

            {viewMode === 'calendar' && (
                <div className='bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden relative animate-in fade-in duration-500'>
                    <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'></div>

                    {/* Navigation - Thu gọn p-8 -> p-4 */}
                    <div className='flex justify-between items-center p-4 border-b border-slate-50 bg-slate-50/30'>
                        <button
                            onClick={() => changeMonth(-1)}
                            className='p-2 hover:bg-white hover:shadow rounded-lg transition-all text-indigo-600 active:scale-90'
                        >
                            <ChevronLeft size={20} strokeWidth={3} />
                        </button>
                        <div className='flex flex-col items-center'>
                            <span className='text-base font-black text-slate-800 tracking-tighter uppercase'>
                                Tháng {currentDate.getMonth() + 1}
                            </span>
                            <span className='text-[10px] font-black text-indigo-400 tracking-[0.2em]'>
                                NĂM {currentDate.getFullYear()}
                            </span>
                        </div>
                        <button
                            onClick={() => changeMonth(1)}
                            className='p-2 hover:bg-white hover:shadow rounded-lg transition-all text-indigo-600 active:scale-90'
                        >
                            <ChevronRight size={20} strokeWidth={3} />
                        </button>
                    </div>

                    <div className='grid grid-cols-7 bg-indigo-50/30 border-b border-slate-100'>
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                            <div
                                key={day}
                                className='py-2 text-center text-[9px] font-black text-indigo-300 uppercase tracking-widest'
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className='grid grid-cols-7 bg-slate-50 gap-px'>
                        {renderCalendar()}
                    </div>

                    <div className='p-3 flex items-center gap-2 text-[9px] font-bold text-slate-400 bg-white italic border-t border-slate-50 uppercase tracking-tight'>
                        <div className='p-1 bg-indigo-50 rounded-md text-indigo-500'>
                            <Info size={12} />
                        </div>
                        Chuyển qua "Danh sách" để xem chi tiết vị trí.
                    </div>
                </div>
            )}
            {viewMode === 'weekly' && (
                <WeeklyCalendarView
                    shifts={shifts}
                    currentDate={currentDate}
                    onOpenDetail={handleOpenDetail}
                    onDateChange={(newDate) => setCurrentDate(newDate)}
                />
            )}

            {viewMode === 'list' && (
                <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
                    {shifts.length === 0 ? (
                        <div className='bg-white p-16 rounded-3xl shadow-sm text-center border-2 border-dashed border-slate-100 flex flex-col items-center'>
                            <CalendarIcon size={40} className='text-indigo-100 mb-4' />
                            <h3 className='text-lg font-black text-slate-800 uppercase tracking-tight'>
                                Lịch làm việc trống
                            </h3>
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                            {shifts.map((item) => (
                                <div
                                    key={item._id}
                                    className='group bg-white rounded-2xl shadow-md hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col relative'
                                >
                                    <div
                                        className='absolute top-0 left-0 w-1 h-full'
                                        style={{
                                            backgroundColor:
                                                item.shift?.color_code || '#4f46e5',
                                        }}
                                    ></div>

                                    <div className='p-4 flex justify-between items-start border-b border-slate-50'>
                                        <div className='flex flex-col'>
                                            <span className='text-[9px] font-black text-indigo-400 uppercase tracking-widest'>
                                                {formatDate(item.work_date).split(',')[0]}
                                            </span>
                                            <span className='text-sm font-black text-slate-800 tracking-tighter'>
                                                {formatDate(item.work_date).split(',')[1]}
                                            </span>
                                        </div>
                                        <span
                                            className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border-2 shadow-sm ${
                                                item.status === 'COMPLETED'
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : item.status === 'ABSENT'
                                                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                            }`}
                                        >
                                            {item.status === 'ASSIGNED'
                                                ? 'Sắp tới'
                                                : item.status}
                                        </span>
                                    </div>

                                    <div className='px-4 pb-4 flex-1'>
                                        <div
                                            className='mt-3 rounded-xl p-3 border transition-all group-hover:bg-slate-50'
                                            style={{
                                                borderColor: `${item.shift?.color_code}22`,
                                            }}
                                        >
                                            <h3 className='text-sm font-black text-slate-800 tracking-tight mb-2'>
                                                {item.shift?.name || 'Ca làm việc'}
                                            </h3>
                                            <div className='flex items-center text-indigo-600 mb-1.5'>
                                                <Clock
                                                    size={14}
                                                    className='mr-1.5'
                                                    strokeWidth={2.5}
                                                />
                                                <span className='font-black text-base tracking-tighter'>
                                                    {item.shift?.start_time} -{' '}
                                                    {item.shift?.end_time}
                                                </span>
                                            </div>
                                            <div className='flex items-center text-slate-500 text-[10px] font-bold'>
                                                <MapPin
                                                    size={12}
                                                    className='mr-1 text-rose-500'
                                                    strokeWidth={2.5}
                                                />
                                                <span className='truncate'>
                                                    {item.location || 'Văn phòng chính'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <ModalAssignmentDetail
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                assignment={selectedAssignment}
            />
        </div>
    );
};
