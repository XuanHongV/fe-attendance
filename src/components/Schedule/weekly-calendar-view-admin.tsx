import React, { useMemo } from 'react';
import {
    Calendar,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Users,
    Clock,
} from 'lucide-react';

interface WeeklyCalendarViewProps {
    shifts: any[];
    currentDate: Date;
    onOpenDetail: (assignments: any[]) => void;
    onDateChange: (newDate: Date) => void;
}

export const WeeklyCalendarViewAdmin: React.FC<WeeklyCalendarViewProps> = ({
    shifts,
    currentDate,
    onOpenDetail,
    onDateChange,
}) => {
    // 1. Logic tính toán 7 ngày trong tuần
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

    // 2. Lấy danh sách các KHUNG GIỜ DUY NHẤT trong tuần này để làm Sidebar hàng ngang
    const uniqueTimeSlots = useMemo(() => {
        const slots = new Set<string>();
        shifts.forEach((s) => {
            if (s.shift) {
                slots.add(`${s.shift.start_time} - ${s.shift.end_time}`);
            }
        });
        // Sắp xếp khung giờ theo giờ bắt đầu
        return Array.from(slots).sort((a, b) => a.localeCompare(b));
    }, [shifts]);

    // 3. Logic gộp ca theo Ngày và Khung giờ
    const groupedShifts = useMemo(() => {
        const groups = new Map();
        shifts.forEach((item) => {
            const dateStr = item.work_date.split('T')[0];
            const shiftId = item.shift?._id;
            const timeSlot = `${item.shift?.start_time} - ${item.shift?.end_time}`;
            if (!shiftId) return;

            const key = `${dateStr}_${timeSlot}_${shiftId}`;

            if (!groups.has(key)) {
                groups.set(key, {
                    ...item,
                    timeSlot,
                    count: 1,
                    allInGroup: [item],
                });
            } else {
                const existing = groups.get(key);
                existing.count += 1;
                existing.allInGroup.push(item);
            }
        });
        return Array.from(groups.values());
    }, [shifts]);

    const handleNavigate = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + offset);
        onDateChange(newDate);
    };

    return (
        <div className='bg-white rounded-[1.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500'>
            {/* Header điều hướng tuần */}
            <div className='p-3 border-b border-slate-100 flex items-center justify-between bg-white'>
                <div className='flex items-center gap-2'>
                    <button
                        onClick={() => onDateChange(new Date())}
                        className='px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100 active:scale-95 transition-all'
                    >
                        <RotateCcw size={12} className='mr-1 inline' /> Hiện tại
                    </button>
                    <div className='flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200'>
                        <button
                            onClick={() => handleNavigate(-7)}
                            className='p-1.5 hover:bg-white rounded-md transition-all text-slate-600'
                        >
                            <ChevronLeft size={16} strokeWidth={3} />
                        </button>
                        <div className='w-[1px] h-4 bg-slate-200 mx-1'></div>
                        <button
                            onClick={() => handleNavigate(7)}
                            className='p-1.5 hover:bg-white rounded-md transition-all text-slate-600'
                        >
                            <ChevronRight size={16} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                <div className='flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100'>
                    <Calendar size={14} className='text-indigo-500' />
                    <span className='text-[10px] font-black text-slate-700 uppercase'>
                        {weekDays[0].getDate()} Th{weekDays[0].getMonth() + 1} —{' '}
                        {weekDays[6].getDate()} Th{weekDays[6].getMonth() + 1},{' '}
                        {weekDays[6].getFullYear()}
                    </span>
                </div>
            </div>

            {/* Bảng Lịch theo hàng khung giờ */}
            <div className='overflow-x-auto'>
                <div className='min-w-[1000px]'>
                    {/* Header: Thứ & Ngày */}
                    <div className='grid grid-cols-[120px_1fr] bg-slate-50/80 border-b border-slate-100'>
                        <div className='border-r border-slate-200 flex items-center justify-center bg-slate-100/50'>
                            <Clock size={14} className='text-slate-400' />
                        </div>
                        <div className='grid grid-cols-7'>
                            {weekDays.map((day, i) => {
                                const isToday =
                                    new Date().toDateString() === day.toDateString();
                                return (
                                    <div
                                        key={i}
                                        className={`py-3 text-center border-r border-slate-100 last:border-0 ${
                                            isToday
                                                ? 'bg-indigo-500 text-white'
                                                : 'text-slate-500'
                                        }`}
                                    >
                                        <p className='text-[9px] font-black uppercase tracking-tighter opacity-80'>
                                            {day.toLocaleDateString('vi-VN', {
                                                weekday: 'short',
                                            })}
                                        </p>
                                        <p className='text-sm font-black'>
                                            {day.getDate()}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Body: Các hàng Khung giờ */}
                    <div className='bg-white'>
                        {uniqueTimeSlots.length === 0 ? (
                            <div className='py-20 text-center text-slate-300 font-bold uppercase text-xs tracking-widest'>
                                Chưa có ca làm việc nào được phân
                            </div>
                        ) : (
                            uniqueTimeSlots.map((slot, rowIndex) => (
                                <div
                                    key={rowIndex}
                                    className='grid grid-cols-[120px_1fr] border-b border-slate-50 last:border-0 hover:bg-slate-50/30 transition-colors'
                                >
                                    {/* Sidebar: Khung giờ của hàng này */}
                                    <div className='border-r border-slate-100 p-3 flex items-center justify-center bg-slate-50/50'>
                                        <span className='text-[10px] font-black text-indigo-600 tracking-tighter whitespace-nowrap bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100'>
                                            {slot}
                                        </span>
                                    </div>

                                    {/* Các ô chứa ca theo ngày */}
                                    <div className='grid grid-cols-7'>
                                        {weekDays.map((day, colIndex) => {
                                            const dateString = day
                                                .toISOString()
                                                .split('T')[0];
                                            const dayShiftsInSlot = groupedShifts.filter(
                                                (g) =>
                                                    g.work_date.startsWith(dateString) &&
                                                    g.timeSlot === slot
                                            );

                                            return (
                                                <div
                                                    key={colIndex}
                                                    className='p-2 border-r border-slate-50 last:border-0 min-h-[70px] flex flex-col gap-1.5'
                                                >
                                                    {dayShiftsInSlot.map((g) => (
                                                        <div
                                                            key={g._id}
                                                            onClick={() =>
                                                                onOpenDetail(g.allInGroup)
                                                            }
                                                            style={{
                                                                backgroundColor:
                                                                    g.shift.color_code ||
                                                                    '#4f46e5',
                                                            }}
                                                            className='rounded-full shadow-sm p-1 pl-2 flex items-center justify-between group cursor-pointer hover:scale-[1.03] active:scale-95 transition-all border border-black/5'
                                                        >
                                                            <div className='flex items-center gap-1.5 min-w-0'>
                                                                <Users
                                                                    size={10}
                                                                    className='text-white/70 shrink-0'
                                                                />
                                                                <span className='text-[8px] font-black text-white uppercase truncate tracking-tighter'>
                                                                    {g.shift.name}
                                                                </span>
                                                            </div>
                                                            <div className='bg-black/20 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full shrink-0 border border-white/10'>
                                                                {g.count}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className='p-2.5 px-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between'>
                <span className='text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2'>
                    <div className='w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse'></div>
                    Bảng phân ca theo khung giờ
                </span>
                <span className='text-[9px] font-bold text-slate-300 italic'>
                    Dữ liệu hiển thị dựa trên các khung giờ thực tế trong tuần
                </span>
            </div>
        </div>
    );
};
