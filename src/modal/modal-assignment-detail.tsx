import React from 'react';
import {
    X,
    Clock,
    Calendar,
    User,
    Info,
    CheckCircle,
    AlertCircle,
    Building2,
    StickyNote,
} from 'lucide-react';

interface ModalAssignmentDetailProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: any; // Bạn có thể map interface ShiftAssignment vào đây
}

export const ModalAssignmentDetail: React.FC<ModalAssignmentDetailProps> = ({
    isOpen,
    onClose,
    assignment,
}) => {
    if (!isOpen || !assignment) return null;

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).format(new Date(dateString));
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PRESENT':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'ABSENT':
                return 'bg-rose-50 text-rose-700 border-rose-100';
            default:
                return 'bg-amber-50 text-amber-700 border-amber-100';
        }
    };

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            {/* Backdrop */}
            <div
                className='absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200'
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className='relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100'>
                {/* Header với Gradient mỏng */}
                <div className='absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'></div>

                <div className='p-6'>
                    <div className='flex justify-between items-start mb-6'>
                        <div className='flex items-center gap-3'>
                            <div
                                className='w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg'
                                style={{
                                    backgroundColor:
                                        assignment.shift?.color_code || '#4f46e5',
                                }}
                            >
                                <Clock size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className='text-base font-black text-slate-800 uppercase tracking-tight leading-none'>
                                    Chi tiết ca làm
                                </h3>
                                <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1'>
                                    Shift Assignment Detail
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className='p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors'
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Main Info Card */}
                    <div className='space-y-4'>
                        {/* Ca làm việc & Giờ */}
                        <div className='bg-slate-50 rounded-2xl p-4 border border-slate-100'>
                            <div className='flex justify-between items-center mb-2'>
                                <span className='text-[10px] font-black text-indigo-500 uppercase tracking-widest'>
                                    Ca thực hiện
                                </span>
                                <span
                                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${getStatusStyle(
                                        assignment.status
                                    )}`}
                                >
                                    {assignment.status}
                                </span>
                            </div>
                            <h4 className='text-lg font-black text-slate-800 mb-1'>
                                {assignment.shift?.name}
                            </h4>
                            <div className='flex items-center gap-2 text-indigo-600 font-black text-sm'>
                                <Clock size={14} />
                                <span>
                                    {assignment.shift?.start_time} —{' '}
                                    {assignment.shift?.end_time}
                                </span>
                            </div>
                        </div>

                        {/* Thông tin chi tiết */}
                        <div className='grid grid-cols-1 gap-3 px-1'>
                            <div className='flex items-center gap-3'>
                                <div className='p-2 bg-indigo-50 text-indigo-600 rounded-lg'>
                                    <Calendar size={14} />
                                </div>
                                <div>
                                    <p className='text-[9px] font-black text-slate-400 uppercase leading-none mb-1'>
                                        Ngày làm việc
                                    </p>
                                    <p className='text-xs font-bold text-slate-700'>
                                        {formatDate(assignment.work_date)}
                                    </p>
                                </div>
                            </div>

                            <div className='flex items-center gap-3'>
                                <div className='p-2 bg-purple-50 text-purple-600 rounded-lg'>
                                    <User size={14} />
                                </div>
                                <div>
                                    <p className='text-[9px] font-black text-slate-400 uppercase leading-none mb-1'>
                                        Người phân ca
                                    </p>
                                    <p className='text-xs font-bold text-slate-700'>
                                        {assignment.assigned_by?.fullName || 'Hệ thống'}
                                    </p>
                                </div>
                            </div>

                            <div className='flex items-center gap-3'>
                                <div className='p-2 bg-blue-50 text-blue-600 rounded-lg'>
                                    <Building2 size={14} />
                                </div>
                                <div>
                                    <p className='text-[9px] font-black text-slate-400 uppercase leading-none mb-1'>
                                        Địa điểm
                                    </p>
                                    <p className='text-xs font-bold text-slate-700'>
                                        {assignment.location || 'Văn phòng chính'}
                                    </p>
                                </div>
                            </div>

                            {assignment.note && (
                                <div className='flex items-start gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50 mt-2'>
                                    <StickyNote
                                        size={14}
                                        className='text-amber-500 shrink-0 mt-0.5'
                                    />
                                    <p className='text-[11px] font-medium text-amber-800 leading-relaxed italic'>
                                        "{assignment.note}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className='w-full mt-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-200'
                    >
                        Đóng cửa sổ
                    </button>
                </div>
            </div>
        </div>
    );
};
