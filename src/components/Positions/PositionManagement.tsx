import React, { useState, useEffect, FormEvent } from 'react';
import {
    Briefcase,
    Search,
    Plus,
    Edit,
    Trash2,
    X,
    Loader2,
    DollarSign,
    MoreHorizontal,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import api from '../../services/apiService';
import toastService from '../../services/toastService';

interface Position {
    _id: string;
    code: string;
    name: string;
    hourlyRate: number;
    isActive: boolean;
}

export const PositionManagement = () => {
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState<Position | null>(null);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        hourlyRate: 0,
        isActive: true,
    });

    const fetchPositions = async () => {
        setLoading(true);
        try {
            const response = await api.get('/positions');
            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.data || [];
            setPositions(data);
        } catch (error) {
            console.error('Lỗi tải danh sách vị trí:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPositions();
    }, []);

    const handleOpenModal = (position?: Position) => {
        if (position) {
            setEditingPosition(position);
            setFormData({
                code: position.code,
                name: position.name,
                hourlyRate: position.hourlyRate || 0,
                isActive: position.isActive,
            });
        } else {
            setEditingPosition(null);
            setFormData({ code: '', name: '', hourlyRate: 0, isActive: true });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!toastService.confirm('Xóa Vị trí này',
            'Bạn có chắc chắn muốn xóa vị trí này? Hành động này sẽ xóa toàn bộ dữ liệu chi tiết liên quan.',
            'Xóa',
            'Hủy')) return;
        try {
            await api.delete(`/positions/${id}`);
            setPositions((prev) => prev.filter((p) => p._id !== id));
        } catch (error: any) {
            toastService.error(error.response?.data?.message || 'Lỗi khi xóa vị trí này');
            
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                code: formData.code.trim().toUpperCase(),
                name: formData.name.trim(),
                hourlyRate: Number(formData.hourlyRate),
                isActive: Boolean(formData.isActive),
            };

            if (editingPosition) {
                await api.patch(`/positions/${editingPosition._id}`, payload);
            } else {
                await api.post('/positions', payload);
            }
            setIsModalOpen(false);
            fetchPositions();
        } catch (error: any) {
            const errorData = error.response?.data;
            alert(errorData?.message || 'Có lỗi xảy ra');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
            amount
        );

    const filteredPositions = positions.filter(
        (p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading)
        return (
            <div className='p-10 text-center min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50'>
                <Loader2 className='animate-spin text-indigo-600 w-10 h-10' />
                <p className='text-indigo-900 font-bold uppercase tracking-widest text-[10px]'>
                    Đang tải cấu hình vị trí...
                </p>
            </div>
        );

    return (
        <div className='p-4 bg-slate-50 min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900'>
            <div className='max-w-7xl mx-auto'>
                {/* Header Banner - Thu gọn text-xl, p-4 */}
                <div className='mb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-gradient-to-r from-indigo-600 to-blue-500 p-4 rounded-xl shadow-md shadow-blue-200'>
                    <div>
                        <h2 className='text-xl font-black text-white tracking-tight flex items-center gap-2'>
                            <div className='p-1.5 bg-white/20 backdrop-blur-md rounded-lg'>
                                <Briefcase size={20} className='text-white' />
                            </div>
                            Quản lý Vị Trí
                        </h2>
                        <p className='text-indigo-100 text-[11px] mt-1 font-medium opacity-90 ml-1 uppercase tracking-wider'>
                            Thiết lập vị trí & Định mức lương giờ
                        </p>
                    </div>
                    <button
                        onClick={() => handleOpenModal()}
                        className='bg-white text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-md font-bold text-xs uppercase tracking-widest active:scale-95'
                    >
                        <Plus size={16} /> <span>Thêm Vị trí</span>
                    </button>
                </div>

                {/* Toolbar - Nhỏ gọn hơn */}
                <div className='bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 relative overflow-hidden'>
                    <div className='absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'></div>

                    <div className='flex-1 max-w-sm relative group'>
                        <Search
                            className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors'
                            size={16}
                        />
                        <input
                            type='text'
                            placeholder='Tìm tên hoặc mã chức vụ...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full pl-9 pr-3 py-1.5 bg-slate-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 rounded-lg outline-none transition-all font-medium text-xs'
                        />
                    </div>
                </div>

                {/* Grid Content - Sử dụng font-size nhỏ và layout gọn */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {filteredPositions.map((item) => (
                        <div
                            key={item._id}
                            className='group bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-100 transition-all duration-300 flex flex-col overflow-hidden relative'
                        >
                            <div className='p-4 border-b border-slate-50 flex justify-between items-start bg-slate-50/30'>
                                <div className='flex items-center gap-2.5'>
                                    <div className='w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-indigo-100 shadow-lg group-hover:rotate-6 transition-transform'>
                                        {item.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className='font-black text-slate-800 text-sm group-hover:text-indigo-600 transition-colors leading-tight'>
                                            {item.name}
                                        </h3>
                                        <span className='text-[9px] font-black text-slate-400 bg-white border border-slate-100 px-1.5 py-0.5 rounded mt-0.5 inline-block uppercase tracking-tighter'>
                                            CODE: {item.code}
                                        </span>
                                    </div>
                                </div>
                                <button className='text-slate-300 hover:text-indigo-600 transition-colors'>
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>

                            <div className='p-4 flex-1'>
                                <div className='flex items-center justify-between'>
                                    <div className='flex items-center gap-1.5 text-slate-500'>
                                        <div className='p-1 bg-emerald-50 text-emerald-600 rounded-md'>
                                            <DollarSign size={12} />
                                        </div>
                                        <span className='text-[10px] font-bold uppercase tracking-wider'>
                                            Định mức lương
                                        </span>
                                    </div>
                                    <div className='text-right'>
                                        <span className='font-black text-indigo-600 text-sm'>
                                            {formatCurrency(item.hourlyRate || 0)}
                                        </span>
                                        <span className='text-[9px] font-black text-slate-400 ml-1 uppercase'>
                                            / giờ
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className='p-3 px-4 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center'>
                                <span
                                    className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm ${
                                        item.isActive
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            : 'bg-rose-50 text-rose-700 border-rose-100'
                                    }`}
                                >
                                    {item.isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                                </span>
                                <div className='flex gap-1.5'>
                                    <button
                                        onClick={() => handleOpenModal(item)}
                                        className='p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all hover:shadow-sm'
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        className='p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all hover:shadow-sm'
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Modal Form - Thu nhỏ và tinh tế */}
                {isModalOpen && (
                    <div className='fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300'>
                        <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white'>
                            <div className='px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 flex justify-between items-center'>
                                <div>
                                    <h3 className='text-base font-black text-white uppercase tracking-tight'>
                                        {editingPosition
                                            ? 'Cập nhật Chức vụ'
                                            : 'Thêm Chức vụ Mới'}
                                    </h3>
                                    <p className='text-indigo-100 text-[9px] font-bold uppercase tracking-widest opacity-80'>
                                        Hệ thống phân quyền
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className='text-white/60 hover:text-white transition-colors bg-white/10 p-1.5 rounded-full'
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className='p-5 space-y-4'>
                                <div className='grid grid-cols-2 gap-3'>
                                    <div className='space-y-1'>
                                        <label className='text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1'>
                                            Tên Chức vụ
                                        </label>
                                        <input
                                            type='text'
                                            required
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            className='w-full px-3 py-2 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all font-bold text-xs text-slate-700'
                                        />
                                    </div>
                                    <div className='space-y-1'>
                                        <label className='text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1'>
                                            Mã định danh
                                        </label>
                                        <input
                                            type='text'
                                            required
                                            value={formData.code}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    code: e.target.value.toUpperCase(),
                                                })
                                            }
                                            className='w-full px-3 py-2 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all font-black text-xs text-indigo-600 uppercase'
                                        />
                                    </div>
                                </div>

                                <div className='space-y-1'>
                                    <label className='text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1'>
                                        Lương theo giờ (VND)
                                    </label>
                                    <div className='relative'>
                                        <div className='absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 font-bold text-xs'>
                                            ₫
                                        </div>
                                        <input
                                            type='text'
                                            min='0'
                                            required
                                            value={formData.hourlyRate}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    hourlyRate: Number(e.target.value),
                                                })
                                            }
                                            className='w-full pl-7 pr-3 py-2 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl outline-none transition-all font-black text-xs text-slate-700'
                                        />
                                    </div>
                                </div>

                                <div className='flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100'>
                                    <input
                                        type='checkbox'
                                        id='isActive'
                                        checked={formData.isActive}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                isActive: e.target.checked,
                                            })
                                        }
                                        className='w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 border-slate-300'
                                    />
                                    <label
                                        htmlFor='isActive'
                                        className='text-[11px] font-bold text-slate-600 cursor-pointer select-none'
                                    >
                                        Đang kích hoạt trạng thái làm việc
                                    </label>
                                </div>

                                <div className='pt-2 flex gap-2'>
                                    <button
                                        type='button'
                                        onClick={() => setIsModalOpen(false)}
                                        className='flex-1 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all'
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type='submit'
                                        disabled={isSubmitting}
                                        className='flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 hover:from-indigo-700 transition-all active:scale-95 flex justify-center items-center gap-2 disabled:opacity-70'
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className='animate-spin w-3.5 h-3.5' />
                                        ) : editingPosition ? (
                                            'Cập nhật'
                                        ) : (
                                            'Tạo mới'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
