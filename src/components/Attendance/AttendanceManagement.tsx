import React, { useEffect, useState, FormEvent } from 'react';
import {
    Search,
    Clock,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Calendar,
    X,
    Plus,
    Users,
    Filter,
    Download,
    MoreHorizontal,
    Sparkles,
} from 'lucide-react';
import api from '../../services/apiService';

/* ======================= 
    TYPES (Giữ nguyên)
======================= */
type AttendanceStatus = 'PRESENT' | 'LATE' | 'DONE' | 'ABSENT';

interface AttendanceRecord {
    id: string;
    employeeName: string;
    avatar: string;
    date: string;
    checkInTime: string;
    checkOutTime: string;
    workHours: number;
    status: AttendanceStatus;
}

interface EmployeeOption {
    id: string;
    fullName: string;
}

/* ======================= 
    HELPERS (Giữ nguyên logic)
======================= */
const getCurrentVNDate = () => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
};

const formatTime = (iso?: string | null) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
};

const getStatusStyle = (status: AttendanceStatus) => {
    switch (status) {
        case 'PRESENT':
            return {
                icon: CheckCircle,
                color: 'text-emerald-700 bg-emerald-100/80 border-emerald-200 shadow-emerald-100',
                text: 'Có mặt',
            };
        case 'LATE':
            return {
                icon: Clock,
                color: 'text-amber-700 bg-amber-100/80 border-amber-200 shadow-amber-100',
                text: 'Đi trễ',
            };
        case 'DONE':
            return {
                icon: CheckCircle,
                color: 'text-indigo-700 bg-indigo-100/80 border-indigo-200 shadow-indigo-100',
                text: 'Hoàn thành',
            };
        case 'ABSENT':
            return {
                icon: XCircle,
                color: 'text-rose-700 bg-rose-100/80 border-rose-200 shadow-rose-100',
                text: 'Vắng mặt',
            };
        default:
            return {
                icon: AlertTriangle,
                color: 'text-slate-700 bg-slate-100 border-slate-200',
                text: 'Không rõ',
            };
    }
};

export const AttendanceManagement: React.FC = () => {
    // STATE & EFFECT (Giữ nguyên hoàn toàn)
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<AttendanceStatus | 'all'>('all');
    const [selectedDate, setSelectedDate] = useState(getCurrentVNDate());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [newAttendance, setNewAttendance] = useState({
        userId: '',
        date: getCurrentVNDate(),
        checkInTime: '08:00',
        checkOutTime: '17:00',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const userStr = localStorage.getItem('user');
            const currentUser = userStr ? JSON.parse(userStr) : null;
            const companyId = currentUser?.company?._id || currentUser?.company;
            if (!companyId) throw new Error('Không tìm thấy công ty');

            const [attendanceRes, usersRes] = await Promise.all([
                api.get('/attendance/attendance_all'),
                api.get(`/users/company/id/${companyId}`),
            ]);

            const attendanceRaw = attendanceRes.data?.data || attendanceRes.data || [];
            const mappedAttendance: AttendanceRecord[] = attendanceRaw.map((r: any) => {
                const rawDate = r.date ? new Date(r.date) : new Date();
                const vnDateString = new Intl.DateTimeFormat('en-CA', {
                    timeZone: 'Asia/Ho_Chi_Minh',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                }).format(rawDate);

                return {
                    id: r._id || r.id,
                    employeeName: r.employee?.fullName || r.employee?.name || 'Nhân viên',
                    avatar:
                        r.employee?.avatar ||
                        `https://ui-avatars.com/api/?name=${
                            r.employee?.fullName || 'U'
                        }&background=random&color=fff&bold=true`,
                    date: vnDateString,
                    checkInTime: formatTime(r.check_in_time),
                    checkOutTime: formatTime(r.check_out_time),
                    workHours: r.work_hours || 0,
                    status: r.status,
                };
            });
            setAttendanceRecords(mappedAttendance);

            const usersRaw = usersRes.data?.data || usersRes.data || [];
            const staffList: EmployeeOption[] = usersRaw
                .filter((u: any) => u.role?.toUpperCase() === 'STAFF')
                .map((u: any) => ({
                    id: u._id,
                    fullName: u.fullName,
                }));
            setEmployees(staffList);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateAttendance = async (e: FormEvent) => {
        e.preventDefault();
        try {
            const checkInISO = new Date(
                `${newAttendance.date}T${newAttendance.checkInTime}:00+07:00`
            );
            const checkOutISO = new Date(
                `${newAttendance.date}T${newAttendance.checkOutTime}:00+07:00`
            );
            const payload = {
                user: newAttendance.userId,
                check_in_time: checkInISO,
                check_out_time: checkOutISO,
                status: 'DONE',
                note: 'Admin thêm thủ công',
            };
            await api.post('/attendance', payload);
            setIsAddModalOpen(false);
            fetchData();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Lỗi tạo chấm công');
        }
    };

    const filteredData = attendanceRecords.filter((r) => {
        const matchName = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        const matchDate = !selectedDate || r.date === selectedDate;
        return matchName && matchStatus && matchDate;
    });

    const stats = {
        total: filteredData.length,
        present: filteredData.filter((r) => r.status === 'DONE' || r.status === 'PRESENT')
            .length,
        late: filteredData.filter((r) => r.status === 'LATE').length,
        absent: filteredData.filter((r) => r.status === 'ABSENT').length,
    };

    return (
        <div className='p-5 bg-[#F4F7FA] min-h-screen font-sans text-slate-900'>
            <div className='max-w-7xl mx-auto'>
                {/* Header Section - Đã thu nhỏ p-8 -> p-5, rounded-3xl -> rounded-2xl */}
                <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-gradient-to-r from-indigo-600 to-blue-500 p-5 rounded-2xl shadow-lg shadow-blue-200'>
                    <div>
                        <h2 className='text-xl font-black tracking-tight text-white flex items-center gap-2.5'>
                            <div className='p-1.5 bg-white/20 backdrop-blur-md rounded-lg'>
                                <Clock size={22} className='text-white' />
                            </div>
                            Quản lý Chấm công
                        </h2>
                        <p className='text-blue-100 mt-1 text-xs font-medium opacity-90 ml-1'>
                            Hệ thống theo dõi thời gian thực nhân sự (Vietnam UTC+7)
                        </p>
                    </div>
                    <div className='flex gap-2'>
                        <button className='flex items-center gap-1.5 px-3.5 py-2 bg-white border border-transparent rounded-xl text-blue-700 hover:bg-blue-50 transition-all font-bold text-xs shadow-sm'>
                            <Download size={15} /> Báo cáo
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className='bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-emerald-600 transition-all font-bold text-xs shadow-md active:scale-95'
                        >
                            <Plus size={16} /> Thêm mới
                        </button>
                    </div>
                </div>

                {/* Stats Grid - Đã thu nhỏ gap và padding card */}
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
                    <StatCard
                        title='Nhân sự'
                        value={stats.total}
                        icon={<Users />}
                        variant='indigo'
                    />
                    <StatCard
                        title='Có mặt'
                        value={stats.present}
                        icon={<CheckCircle />}
                        variant='emerald'
                    />
                    <StatCard
                        title='Đi muộn'
                        value={stats.late}
                        icon={<Clock />}
                        variant='amber'
                    />
                    <StatCard
                        title='Vắng mặt'
                        value={stats.absent}
                        icon={<XCircle />}
                        variant='rose'
                    />
                </div>

                {/* Filter Bar - p-6 -> p-4, rounded-2rem -> rounded-xl */}
                <div className='bg-white p-4 rounded-xl shadow-sm border border-slate-200/60 mb-6 flex flex-wrap gap-3 items-center relative overflow-hidden'>
                    <div className='absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'></div>
                    <div className='flex-1 min-w-[240px] relative group'>
                        <Search
                            className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors'
                            size={16}
                        />
                        <input
                            className='pl-10 w-full bg-slate-50 border border-transparent focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 rounded-xl py-2 transition-all outline-none font-medium text-sm'
                            placeholder='Tìm kiếm tên nhân viên...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className='flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 focus-within:bg-white focus-within:border-indigo-400 transition-all'>
                        <Calendar size={16} className='text-indigo-500' />
                        <input
                            type='date'
                            className='bg-transparent outline-none text-slate-700 font-bold text-xs'
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    <div className='flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 focus-within:bg-white focus-within:border-indigo-400 transition-all'>
                        <Filter size={16} className='text-indigo-500' />
                        <select
                            value={filterStatus}
                            onChange={(e) =>
                                setFilterStatus(
                                    e.target.value as AttendanceStatus | 'all'
                                )
                            }
                            className='bg-transparent outline-none text-slate-700 font-bold text-xs cursor-pointer'
                        >
                            <option value='all'>Tất cả trạng thái</option>
                            <option value='DONE'>Hoàn thành</option>
                            <option value='PRESENT'>Hiện diện</option>
                            <option value='LATE'>Đi trễ</option>
                            <option value='ABSENT'>Vắng mặt</option>
                        </select>
                    </div>
                </div>

                {/* Table Section - Thu nhỏ padding-cell và font-size */}
                <div className='bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='w-full text-left border-collapse'>
                            <thead>
                                <tr className='bg-slate-50/80 border-b border-slate-100'>
                                    <th className='p-3 pl-6 text-[10px] font-black uppercase tracking-wider text-slate-400'>
                                        Nhân viên
                                    </th>
                                    <th className='p-3 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center'>
                                        Ngày
                                    </th>
                                    <th className='p-3 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center'>
                                        Check-in
                                    </th>
                                    <th className='p-3 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center'>
                                        Check-out
                                    </th>
                                    <th className='p-3 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center'>
                                        Tổng giờ
                                    </th>
                                    <th className='p-3 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center'>
                                        Trạng thái
                                    </th>
                                    <th className='p-3 pr-6'></th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-50'>
                                {loading ? (
                                    <TableSkeleton rows={5} />
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className='text-center py-16'>
                                            <div className='flex flex-col items-center justify-center text-slate-400'>
                                                <div className='bg-indigo-50 p-4 rounded-full mb-3'>
                                                    <Sparkles
                                                        size={32}
                                                        className='text-indigo-300 animate-pulse'
                                                    />
                                                </div>
                                                <p className='text-base font-black text-slate-600'>
                                                    Dữ liệu trống
                                                </p>
                                                <p className='text-xs mt-0.5'>
                                                    Vui lòng kiểm tra lại bộ lọc
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((r) => {
                                        const status = getStatusStyle(r.status);
                                        return (
                                            <tr
                                                key={r.id}
                                                className='group hover:bg-indigo-50/40 transition-all duration-200'
                                            >
                                                <td className='p-3 pl-6'>
                                                    <div className='flex items-center gap-3'>
                                                        <div className='relative'>
                                                            <img
                                                                src={r.avatar}
                                                                alt={r.employeeName}
                                                                className='w-9 h-9 rounded-xl border border-white shadow-sm object-cover group-hover:scale-105 transition-transform'
                                                            />
                                                            <div className='absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full'></div>
                                                        </div>
                                                        <div className='flex flex-col'>
                                                            <span className='font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors'>
                                                                {r.employeeName}
                                                            </span>
                                                            <span className='text-[10px] font-bold text-slate-400'>
                                                                #
                                                                {r.id
                                                                    .slice(-5)
                                                                    .toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className='p-3 text-center font-bold text-slate-600 text-xs'>
                                                    {r.date
                                                        .split('-')
                                                        .reverse()
                                                        .join('/')}
                                                </td>
                                                <td className='p-3 text-center'>
                                                    <span className='inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200'>
                                                        {r.checkInTime}
                                                    </span>
                                                </td>
                                                <td className='p-3 text-center'>
                                                    <span className='inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200'>
                                                        {r.checkOutTime}
                                                    </span>
                                                </td>
                                                <td className='p-3 text-center'>
                                                    <div className='flex flex-col items-center'>
                                                        <span className='text-sm font-black text-indigo-600'>
                                                            {r.workHours}
                                                        </span>
                                                        <span className='text-[8px] uppercase font-black text-slate-400 -mt-0.5'>
                                                            hrs
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className='p-3 text-center'>
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${status.color}`}
                                                    >
                                                        <status.icon
                                                            size={11}
                                                            strokeWidth={3}
                                                        />
                                                        {status.text}
                                                    </span>
                                                </td>
                                                <td className='p-3 pr-6 text-right'>
                                                    <button className='p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all'>
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL - Đã thu nhỏ p-8 -> p-6,rounded -> rounded-2xl */}
            {isAddModalOpen && (
                <div className='fixed inset-0 bg-indigo-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all'>
                    <form
                        onSubmit={handleCreateAttendance}
                        className='bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-white'
                    >
                        <div className='flex justify-between items-center mb-5'>
                            <div>
                                <h3 className='text-lg font-black text-slate-900'>
                                    Thêm chấm công
                                </h3>
                                <div className='h-0.5 w-8 bg-indigo-500 rounded-full mt-1'></div>
                            </div>
                            <button
                                type='button'
                                onClick={() => setIsAddModalOpen(false)}
                                className='p-1.5 hover:bg-rose-50 hover:text-rose-500 rounded-full text-slate-400 transition-all'
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className='space-y-4'>
                            <div>
                                <label className='block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5'>
                                    Nhân viên
                                </label>
                                <select
                                    required
                                    className='w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl px-4 py-2 outline-none transition-all font-bold text-sm text-slate-700'
                                    value={newAttendance.userId}
                                    onChange={(e) =>
                                        setNewAttendance({
                                            ...newAttendance,
                                            userId: e.target.value,
                                        })
                                    }
                                >
                                    <option value=''>Chọn nhân viên</option>
                                    {employees.map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.fullName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className='block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5'>
                                    Ngày làm việc
                                </label>
                                <div className='relative'>
                                    <Calendar
                                        className='absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500'
                                        size={16}
                                    />
                                    <input
                                        type='date'
                                        className='w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl pl-10 pr-4 py-2 outline-none transition-all font-bold text-sm text-slate-700'
                                        value={newAttendance.date}
                                        onChange={(e) =>
                                            setNewAttendance({
                                                ...newAttendance,
                                                date: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-3'>
                                <div>
                                    <label className='block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5'>
                                        Vào ca
                                    </label>
                                    <input
                                        type='time'
                                        className='w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl px-4 py-2 outline-none transition-all font-bold text-sm text-slate-700'
                                        value={newAttendance.checkInTime}
                                        onChange={(e) =>
                                            setNewAttendance({
                                                ...newAttendance,
                                                checkInTime: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className='block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5'>
                                        Ra ca
                                    </label>
                                    <input
                                        type='time'
                                        className='w-full bg-slate-50 border border-slate-200 focus:border-indigo-400 focus:bg-white rounded-xl px-4 py-2 outline-none transition-all font-bold text-sm text-slate-700'
                                        value={newAttendance.checkOutTime}
                                        onChange={(e) =>
                                            setNewAttendance({
                                                ...newAttendance,
                                                checkOutTime: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className='mt-8 grid grid-cols-2 gap-3'>
                            <button
                                type='button'
                                onClick={() => setIsAddModalOpen(false)}
                                className='px-4 py-2.5 border border-slate-100 rounded-xl text-slate-500 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all'
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type='submit'
                                className='px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95'
                            >
                                Xác nhận
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

/* ======================= 
    UI SUB-COMPONENTS 
======================= */
const StatCard = ({ title, value, icon, variant }: any) => {
    const variants: any = {
        indigo: {
            bg: 'bg-white',
            iconBg: 'bg-indigo-50 text-indigo-600',
            border: 'border-l-indigo-500',
            shadow: 'shadow-indigo-100',
        },
        emerald: {
            bg: 'bg-white',
            iconBg: 'bg-emerald-50 text-emerald-600',
            border: 'border-l-emerald-500',
            shadow: 'shadow-emerald-100',
        },
        amber: {
            bg: 'bg-white',
            iconBg: 'bg-amber-50 text-amber-600',
            border: 'border-l-amber-500',
            shadow: 'shadow-amber-100',
        },
        rose: {
            bg: 'bg-white',
            iconBg: 'bg-rose-50 text-rose-600',
            border: 'border-l-rose-500',
            shadow: 'shadow-rose-100',
        },
    };
    const style = variants[variant];

    return (
        <div
            className={`${style.bg} p-4 rounded-2xl border border-slate-100 border-l-4 ${style.border} shadow-md ${style.shadow} flex items-center gap-4 transition-all hover:-translate-y-1`}
        >
            <div className={`p-2.5 rounded-xl ${style.iconBg} shadow-sm`}>
                {React.cloneElement(icon, { size: 22, strokeWidth: 2.5 })}
            </div>
            <div>
                <p className='text-[10px] font-black uppercase tracking-widest text-slate-400'>
                    {title}
                </p>
                <p className='text-xl font-black text-slate-800'>{value}</p>
            </div>
        </div>
    );
};

const TableSkeleton = ({ rows }: { rows: number }) => (
    <>
        {[...Array(rows)].map((_, i) => (
            <tr key={i} className='animate-pulse'>
                <td className='p-3 pl-6'>
                    <div className='flex items-center gap-3'>
                        <div className='w-9 h-9 bg-slate-200 rounded-xl'></div>
                        <div className='space-y-1.5'>
                            <div className='w-24 h-3 bg-slate-200 rounded'></div>
                            <div className='w-16 h-2 bg-slate-100 rounded'></div>
                        </div>
                    </div>
                </td>
                <td className='p-3'>
                    <div className='w-16 h-3 bg-slate-200 rounded mx-auto'></div>
                </td>
                <td className='p-3'>
                    <div className='w-14 h-6 bg-slate-100 rounded-lg mx-auto'></div>
                </td>
                <td className='p-3'>
                    <div className='w-14 h-6 bg-slate-100 rounded-lg mx-auto'></div>
                </td>
                <td className='p-3'>
                    <div className='w-8 h-4 bg-slate-200 rounded mx-auto'></div>
                </td>
                <td className='p-3'>
                    <div className='w-20 h-7 bg-slate-100 rounded-full mx-auto'></div>
                </td>
                <td className='p-3'></td>
            </tr>
        ))}
    </>
);
