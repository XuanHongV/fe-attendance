import React, { useMemo } from 'react';
import { Clock, ChevronLeft, ChevronRight, Calendar, RotateCcw } from 'lucide-react';

interface WeeklyCalendarViewProps {
    shifts: any[];
    currentDate: Date;
    onOpenDetail: (shift: any) => void;
    onDateChange: (newDate: Date) => void; // Dùng để cập nhật state ở component cha
}

export const WeeklyCalendarView: React.FC<WeeklyCalendarViewProps> = ({
    shifts,
    currentDate,
    onOpenDetail,
    onDateChange,
}) => {

    const hours = Array.from({ length: 17 }, (_, i) => i + 6);


    const weekDays = useMemo(() => {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day; 
        startOfWeek.setDate(diff);

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            return d;
        });
    }, [currentDate]);

    const handleNextWeek = () => {
        const next = new Date(currentDate);
        next.setDate(currentDate.getDate() + 7);
        onDateChange(next);
    };

    const handlePrevWeek = () => {
        const prev = new Date(currentDate);
        prev.setDate(currentDate.getDate() - 7);
        onDateChange(prev);
    };

    const handleGoToday = () => {
        onDateChange(new Date());
    };

    const getShiftStyle = (startTime: string, endTime: string, color: string) => {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        const startMinutes = (startH - 6) * 60 + startM;
        const duration = endH * 60 + endM - (startH * 60 + startM);

        return {
            top: `${startMinutes}px`,
            height: `${duration > 30 ? duration : 30}px`,
            backgroundColor: `${color}15`,
            borderLeft: `3px solid ${color}`,
            color: color,
        };
    };

    return (
        <div className='bg-white rounded-[1.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500'>
           
            <div className='p-3 border-b border-slate-100 flex items-center justify-between bg-white'>
                <div className='flex items-center gap-2'>
                    <button
                        onClick={handleGoToday}
                        className='flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100'
                    >
                        <RotateCcw size={12} /> Hiện tại
                    </button>

                    <div className='flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 shadow-inner'>
                        <button
                            onClick={handlePrevWeek}
                            className='p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600 active:scale-90'
                            title='Tuần trước'
                        >
                            <ChevronLeft size={16} strokeWidth={3} />
                        </button>
                        <div className='w-[1px] h-4 bg-slate-200 mx-1'></div>
                        <button
                            onClick={handleNextWeek}
                            className='p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600 active:scale-90'
                            title='Tuần kế tiếp'
                        >
                            <ChevronRight size={16} strokeWidth={3} />
                        </button>
                    </div>
                </div>

               
                <div className='flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100'>
                    <Calendar size={14} className='text-indigo-500' />
                    <span className='text-[10px] font-black text-slate-700 uppercase tracking-tighter'>
                        {weekDays[0].getDate()} Th{weekDays[0].getMonth() + 1} - {'  '}
                        {weekDays[6].getDate()} Th{weekDays[6].getMonth() + 1},{' '}
                        {weekDays[6].getFullYear()}
                    </span>
                </div>
            </div>

            {/* Header Thứ trong tuần */}
            <div className='grid grid-cols-[50px_1fr] border-b border-slate-100 bg-slate-50/50'>
                <div className='border-r border-slate-100'></div>
                <div className='grid grid-cols-7'>
                    {weekDays.map((day, i) => {
                        const isToday = new Date().toDateString() === day.toDateString();
                        return (
                            <div
                                key={i}
                                className={`py-2 text-center border-r border-slate-100 last:border-0 ${
                                    isToday ? 'bg-indigo-50/50' : ''
                                }`}
                            >
                                <p className='text-[8px] font-black uppercase text-slate-400 tracking-tighter'>
                                    {day.toLocaleDateString('vi-VN', {
                                        weekday: 'short',
                                    })}
                                </p>
                                <p
                                    className={`text-sm font-black ${
                                        isToday ? 'text-indigo-600' : 'text-slate-700'
                                    }`}
                                >
                                    {day.getDate()}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Thân Timeline */}
            <div className='relative overflow-y-auto max-h-[450px] custom-scrollbar bg-white'>
                <div
                    className='grid grid-cols-[50px_1fr] relative'
                    style={{ height: `${hours.length * 60}px` }}
                >
                    {/* Cột mốc giờ */}
                    <div className='border-r border-slate-100 bg-slate-50/20'>
                        {hours.map((h) => (
                            <div key={h} className='h-[60px] relative text-center'>
                                <span className='absolute -top-2 left-0 w-full text-[9px] font-bold text-slate-300'>
                                    {`${h.toString().padStart(2, '0')}:00`}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Lưới ca làm việc */}
                    <div className='grid grid-cols-7 relative'>
                        {/* Các đường kẻ ngang mờ */}
                        <div className='absolute inset-0 pointer-events-none'>
                            {hours.map((h) => (
                                <div
                                    key={h}
                                    className='h-[60px] border-b border-slate-50 w-full'
                                ></div>
                            ))}
                        </div>

                        {/* Nội dung ca */}
                        {weekDays.map((day, colIndex) => {
                            const dateString = day.toISOString().split('T')[0];
                            const dayShifts = shifts.filter((s) =>
                                s.work_date.startsWith(dateString)
                            );

                            return (
                                <div
                                    key={colIndex}
                                    className='relative border-r border-slate-100/50 last:border-0'
                                >
                                    {dayShifts.map((s) => (
                                        <div
                                            key={s._id}
                                            onClick={() => onOpenDetail(s)}
                                            style={getShiftStyle(
                                                s.shift.start_time,
                                                s.shift.end_time,
                                                s.shift.color_code || '#4f46e5'
                                            )}
                                            className='absolute left-0.5 right-0.5 rounded-lg border border-white shadow-sm p-1 overflow-hidden group cursor-pointer hover:z-20 hover:scale-[1.03] transition-all'
                                        >
                                            <p className='text-[8px] font-black truncate leading-tight uppercase'>
                                                {s.shift.name}
                                            </p>
                                            <p className='text-[8px] font-bold tracking-tighter opacity-80'>
                                                {s.shift.start_time}-{s.shift.end_time}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
