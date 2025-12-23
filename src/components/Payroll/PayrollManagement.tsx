import { useEffect, useState } from 'react';
import {
    Search,
    Download,
    CheckCircle,
    Clock,
    CreditCard,
    ArrowUpRight,
    AlertTriangle,
    FileText,
    Plus,
    X,
    Loader2,
    Play,
    Lock,
    Trash2,
    Copy,
} from 'lucide-react';
import timesheetService, {
    TimeSheet,
    TimeSheetDetail,
    CreateTimeSheetDto,
    TimeSheetStatus,
} from '../../services/timesheetService';
import toastService from '../../services/toastService';
import PayrollReceiptModal from './PayrollReceiptModal';

export const PayrollManagement = () => {
    const [payrolls, setPayrolls] = useState<TimeSheetDetail[]>([]);
    const [timesheets, setTimesheets] = useState<TimeSheet[]>([]);
    const [selectedTimesheet, setSelectedTimesheet] = useState<TimeSheet | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [formData, setFormData] = useState<CreateTimeSheetDto>({
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        note: '',
    });

    // Receipt modal state to view payroll receipt for PAID items
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [currentReceiptDetailId, setCurrentReceiptDetailId] = useState<string | null>(
        null
    );

    const openReceipt = (detailId: string) => {
        setCurrentReceiptDetailId(detailId);
        setIsReceiptModalOpen(true);
    };
    const ethExchangeRateVnd = Number(
        import.meta.env.VITE_ETH_EXCHANGE_RATE_VND ??
            import.meta.env.ETH_EXCHANGE_RATE_VND ??
            0
    );
    const fetchTimesheets = async () => {
        try {
            const timesheetList = await timesheetService.getAll();
            setTimesheets(timesheetList);

         
            setSelectedTimesheet((prev) => {
                if (!prev && timesheetList.length > 0) {
                    return timesheetList[0];
                }
                if (prev && timesheetList.length > 0) {
                    const found = timesheetList.find((ts) => ts._id === prev._id);
                    return found || prev;
                }
                return prev;
            });
        } catch (error) {
            console.error('Lỗi tải danh sách timesheet:', error);
            toastService.error('Không thể tải danh sách timesheet');
            setTimesheets([]);
        }
    };

    const fetchTimesheetDetails = async (timesheetId: string) => {
        try {
            const details = await timesheetService.getDetails(timesheetId);
            console.log('detai sheet', details[0]?.user);
            setPayrolls(details);
        } catch (error) {
            toastService.error('Không thể tải chi tiết timesheet');
            setPayrolls([]);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            if (selectedTimesheet) {
                await fetchTimesheetDetails(selectedTimesheet._id);
            } else {
                setPayrolls([]);
            }
        } catch (error) {
            console.error('Lỗi tải bảng lương:', error);
            setPayrolls([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimesheets();
    }, []);

    useEffect(() => {
        fetchData();
    }, [selectedTimesheet]);

    const handleCreateTimesheet = async () => {
        if (!formData.startDate) {
            toastService.error('Vui lòng chọn ngày bắt đầu');
            return;
        }

        setIsCreating(true);
        try {
            const newTimesheet = await timesheetService.create({
                startDate: new Date(formData.startDate).toISOString(),
                endDate: formData.endDate
                    ? new Date(formData.endDate).toISOString()
                    : undefined,
                note: formData.note,
            });

            await fetchTimesheets();
            setSelectedTimesheet(newTimesheet);
            setIsCreateModalOpen(false);
            setFormData({
                startDate: new Date().toISOString().slice(0, 10),
                endDate: '',
                note: '',
            });
            toastService.success('Tạo timesheet thành công!');
        } catch (error) {
            setFormData({
                startDate: new Date().toISOString().slice(0, 10),
                endDate: '',
                note: '',
            });
            console.error('Lỗi tạo timesheet:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleGenerateDetails = async () => {
        if (!selectedTimesheet) return;

        const isFirstTime = selectedTimesheet.status === 'DRAFT';
        const message = isFirstTime
            ? 'Bạn có chắc chắn muốn tính toán chi tiết timesheet? Hệ thống sẽ quét lịch làm việc và chấm công để tính giờ làm và tiền lương tạm tính.'
            : 'Bạn có chắc chắn muốn tính toán lại chi tiết timesheet? Hành động này sẽ cập nhật dữ liệu dựa trên attendance hiện tại. Bạn có thể chạy lại nhiều lần nếu có nhân viên bổ sung công hoặc chỉnh sửa chấm công.';

        const confirmed = await toastService.confirm(
            'Xác nhận',
            message,
            'Tính toán',
            'Hủy'
        );

        if (!confirmed) return;

        setIsGenerating(true);
        try {
            const details = await timesheetService.generateDetails(selectedTimesheet._id);
            setPayrolls(details);
            // Refresh danh sách timesheet để cập nhật status
            await fetchTimesheets();
            toastService.success(
                isFirstTime
                    ? 'Tính toán chi tiết timesheet thành công! Bảng công đã chuyển sang trạng thái MỞ.'
                    : 'Tính toán lại chi tiết timesheet thành công!'
            );
        } catch (error: any) {
            console.error('Lỗi tính toán chi tiết:', error);
            const errorMessage =
                error?.response?.data?.message ||
                'Không thể tính toán chi tiết timesheet';
            toastService.error(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCloseTimesheet = async () => {
        if (!selectedTimesheet) return;

        const confirmed = await toastService.confirm(
            'Chốt Timesheet',
            'Bạn có chắc chắn muốn chốt timesheet này? Sau khi chốt, không thể chỉnh sửa.',
            'Chốt',
            'Hủy'
        );

        if (!confirmed) return;

        try {
            const closed = await timesheetService.close(selectedTimesheet._id);
            // Refresh danh sách để đảm bảo sync
            await fetchTimesheets();
            setSelectedTimesheet(closed);
            toastService.success('Chốt timesheet thành công!');
        } catch (error) {
            console.error('Lỗi chốt timesheet:', error);
            toastService.error('Không thể chốt timesheet');
        }
    };

    const handleDeleteTimesheet = async () => {
        if (!selectedTimesheet) return;

        const confirmed = await toastService.confirm(
            'Xóa Timesheet',
            'Bạn có chắc chắn muốn xóa timesheet này? Hành động này sẽ xóa toàn bộ dữ liệu chi tiết liên quan.',
            'Xóa',
            'Hủy'
        );

        if (!confirmed) return;

        setIsDeleting(true);
        try {
            await timesheetService.delete(selectedTimesheet._id);
            setSelectedTimesheet(null);
            await fetchTimesheets();
            toastService.success('Đã xóa timesheet thành công');
        } catch (error) {
            console.error('Lỗi xóa timesheet:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const totalPayroll = payrolls.reduce(
        (acc, curr) => acc + (curr.total_amount || 0),
        0
    );
    const paidCount = payrolls.filter((p) => p.approved_at).length;
    const pendingCount = payrolls.length - paidCount;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount || 0);
    };

    const formatEthAmount = (amount: number) => {
        if (!ethExchangeRateVnd) return 'N/A';
        const ethValue = (amount || 0) / ethExchangeRateVnd;
        return `${ethValue.toFixed(6)} ETH`;
    };

    const formatWallet = (address?: string) => {
        if (!address) return '';
        return address.length > 16
            ? `${address.slice(0, 10)}...${address.slice(-4)}`
            : address;
    };

    const handleCopyWallet = async (address?: string) => {
        if (!address) return;
        try {
            await navigator.clipboard.writeText(address);
            toastService.success('Đã sao chép địa chỉ ví');
        } catch {
            toastService.error('Không thể sao chép địa chỉ ví');
        }
    };

    const handleApprove = async (id: string) => {
        const confirmed = await toastService.confirm(
            'Xác nhận',
            'Xác nhận duyệt chi lương cho nhân viên này?',
            'Duyệt',
            'Hủy'
        );
        if (!confirmed) return;

        try {
            const payment = await timesheetService.payrollEmployee(id);
            setPayrolls((prev) =>
                prev.map((p) =>
                    p._id === id
                        ? {
                              ...p,
                              approved_at: payment?.paid_at || new Date().toISOString(),
                              pay_status: 'PAID',
                          }
                        : p
                )
            );
            toastService.success('Duyệt chi lương thành công!');
        } catch (error) {
            console.error('Lỗi khi duyệt lương:', error);
            toastService.error('Lỗi khi duyệt lương');
        }
    };

    const getStatusBadge = (status: TimeSheetStatus) => {
        const statusConfig = {
            DRAFT: {
                bg: 'bg-gray-100',
                text: 'text-gray-700',
                label: 'Nháp',
                icon: FileText,
            },
            OPEN: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Mở', icon: Play },
            CLOSED: {
                bg: 'bg-green-100',
                text: 'text-green-700',
                label: 'Đã chốt',
                icon: Lock,
            },
        };
        const config = statusConfig[status];
        const Icon = config.icon;
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text} border`}
            >
                <Icon size={12} /> {config.label}
            </span>
        );
    };

    return (
        <div className='min-h-screen bg-gray-50/50 p-6 font-sans text-gray-800'>
            <div className='max-w-7xl mx-auto space-y-8'>
                {/* --- HEADER --- */}
                <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-200/60'>
                    <div className='flex-1'>
                        <h1 className='text-3xl font-bold text-gray-900 flex items-center gap-3 tracking-tight'>
                            Quản Lý Lương
                        </h1>
                        {selectedTimesheet && (
                            <div className='mt-2 space-y-2'>
                                <div className='flex items-center gap-3 flex-wrap'>
                                    <p className='text-gray-600 text-sm'>
                                        <span className='font-semibold'>Kỳ công:</span>{' '}
                                        {new Date(
                                            selectedTimesheet.start_date
                                        ).toLocaleDateString('vi-VN')}
                                        {selectedTimesheet.end_date
                                            ? ` - ${new Date(
                                                  selectedTimesheet.end_date
                                              ).toLocaleDateString('vi-VN')}`
                                            : ' (Chưa chốt)'}
                                    </p>
                                    {getStatusBadge(selectedTimesheet.status)}
                                </div>
                                {selectedTimesheet.status === 'DRAFT' && (
                                    <p className='text-xs text-gray-500 italic'>
                                        Nháp: Bảng công chỉ là "vỏ", chưa có dữ liệu chi
                                        tiết. Nhấn "Tổng hợp công" để tính toán.
                                    </p>
                                )}
                                {selectedTimesheet.status === 'OPEN' && (
                                    <p className='text-xs text-blue-600 italic'>
                                        Mở: Đã có dữ liệu tạm tính. Có thể tính toán lại
                                        nhiều lần nếu có thay đổi. Nhân viên có thể xem
                                        bảng công của mình.
                                    </p>
                                )}
                                {selectedTimesheet.status === 'CLOSED' && (
                                    <p className='text-xs text-green-600 italic'>
                                        Đã chốt: Dữ liệu đã được đóng băng. Không thể tính
                                        toán lại hoặc chỉnh sửa. Dùng để tính lương chính
                                        thức.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className='flex items-center gap-3 flex-wrap'>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className='flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 font-medium transition-all text-sm active:transform active:scale-95'
                        >
                            <Plus size={18} /> Tạo Timesheet
                        </button>
                        {selectedTimesheet && selectedTimesheet.status === 'DRAFT' && (
                            <button
                                onClick={handleGenerateDetails}
                                disabled={isGenerating}
                                className='flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 font-medium transition-all text-sm active:transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
                                title='Tổng hợp công - Tính toán chi tiết từ attendance và shift assignments'
                            >
                                {isGenerating ? (
                                    <Loader2 size={18} className='animate-spin' />
                                ) : (
                                    <Play size={18} />
                                )}{' '}
                                Tổng hợp công
                            </button>
                        )}
                        {selectedTimesheet && selectedTimesheet.status === 'OPEN' && (
                            <>
                                <button
                                    onClick={handleGenerateDetails}
                                    disabled={isGenerating}
                                    className='flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 font-medium transition-all text-sm active:transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
                                    title='Tính toán lại - Có thể chạy lại nhiều lần nếu có thay đổi'
                                >
                                    {isGenerating ? (
                                        <Loader2 size={18} className='animate-spin' />
                                    ) : (
                                        <Play size={18} />
                                    )}{' '}
                                    Tính toán lại
                                </button>
                                <button
                                    onClick={handleCloseTimesheet}
                                    className='flex items-center gap-2 bg-amber-600 text-white px-5 py-2.5 rounded-xl hover:bg-amber-700 shadow-lg shadow-amber-200 font-medium transition-all text-sm active:transform active:scale-95'
                                    title='Chốt công - Sau khi chốt không thể tính toán lại'
                                >
                                    <Lock size={18} /> Chốt công
                                </button>
                            </>
                        )}
                        {selectedTimesheet && selectedTimesheet.status === 'CLOSED' && (
                            <div className='flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-200 text-sm font-medium'>
                                <Lock size={16} /> Đã chốt - Không thể chỉnh sửa
                            </div>
                        )}
                        {selectedTimesheet && (
                            <button
                                onClick={handleDeleteTimesheet}
                                disabled={isDeleting}
                                className='flex items-center gap-2 bg-red-100 text-red-700 px-5 py-2.5 rounded-xl hover:bg-red-200 border border-red-200 font-medium transition-all text-sm active:transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed'
                            >
                                {isDeleting ? (
                                    <Loader2 size={18} className='animate-spin' />
                                ) : (
                                    <Trash2 size={18} />
                                )}
                                Xóa Timesheet
                            </button>
                        )}
                        <button className='flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 shadow-lg shadow-gray-200 font-medium transition-all text-sm active:transform active:scale-95'>
                            <Download size={18} /> Xuất Excel
                        </button>
                    </div>
                </div>

                {/* --- STATS CARDS --- */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group hover:shadow-md transition-all'>
                        <div className='absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-bl-[4rem] -mr-6 -mt-6 transition-transform group-hover:scale-110'></div>
                        <p className='text-gray-500 text-sm font-semibold uppercase tracking-wider relative z-10'>
                            Tổng quỹ lương
                        </p>
                        <h3 className='text-4xl font-extrabold text-gray-900 mt-2 relative z-10 tracking-tight'>
                            {formatCurrency(totalPayroll)}
                        </h3>
                        <div className='mt-4 flex items-center gap-2 text-green-600 text-xs font-bold relative z-10 bg-green-50 w-fit px-2 py-1 rounded-md'>
                            <ArrowUpRight size={14} /> + Dữ liệu thực tế
                        </div>
                    </div>

                    <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all'>
                        <div className='flex justify-between items-start'>
                            <div>
                                <p className='text-gray-500 text-sm font-semibold uppercase tracking-wider'>
                                    Đã thanh toán
                                </p>
                                <h3 className='text-3xl font-bold text-indigo-600 mt-2'>
                                    {paidCount}
                                </h3>
                                <p className='text-xs text-gray-400 mt-1 font-medium'>
                                    Nhân viên
                                </p>
                            </div>
                            <div className='p-3 bg-indigo-50 text-indigo-600 rounded-xl'>
                                <CheckCircle size={28} />
                            </div>
                        </div>
                        <div className='mt-4 h-2 w-full bg-gray-100 rounded-full overflow-hidden'>
                            <div
                                className='h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out'
                                style={{
                                    width: `${
                                        (paidCount / (payrolls.length || 1)) * 100
                                    }%`,
                                }}
                            ></div>
                        </div>
                    </div>

                    <div className='bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all'>
                        <div className='flex justify-between items-start'>
                            <div>
                                <p className='text-gray-500 text-sm font-semibold uppercase tracking-wider'>
                                    Chờ duyệt chi
                                </p>
                                <h3 className='text-3xl font-bold text-amber-500 mt-2'>
                                    {pendingCount}
                                </h3>
                                <p className='text-xs text-gray-400 mt-1 font-medium'>
                                    Nhân viên
                                </p>
                            </div>
                            <div className='p-3 bg-amber-50 text-amber-500 rounded-xl'>
                                <Clock size={28} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- TIMESHEET SELECTOR (if multiple timesheets) --- */}
                {timesheets.length > 0 && (
                    <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-4'>
                        <label className='block text-sm font-bold text-gray-700 mb-2'>
                            Chọn Timesheet:
                        </label>
                        <div className='flex gap-2 flex-wrap'>
                            {timesheets.map((ts) => (
                                <button
                                    key={ts._id}
                                    onClick={() => setSelectedTimesheet(ts)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                        selectedTimesheet?._id === ts._id
                                            ? 'bg-indigo-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {new Date(ts.start_date).toLocaleDateString('vi-VN')}
                                    {ts.end_date &&
                                        ` - ${new Date(ts.end_date).toLocaleDateString(
                                            'vi-VN'
                                        )}`}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className='bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden'>
                    <div className='p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4 bg-gray-50/30'>
                        <div className='relative flex-1 max-w-md'>
                            <Search
                                className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
                                size={18}
                            />
                            <input
                                type='text'
                                placeholder='Tìm kiếm nhân viên...'
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className='w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-sm'
                            />
                        </div>
                    </div>

                    <div className='overflow-x-auto'>
                        <table className='w-full text-xs md:text-sm'>
                            <thead className='bg-gray-50 border-b border-gray-200'>
                                <tr>
                                    <th className='py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-wider'>
                                        Nhân viên
                                    </th>
                                    <th className='py-4 px-6 text-left text-xs font-bold text-gray-500 uppercase tracking-wider'>
                                        Ví ETH
                                    </th>
                                    <th className='py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider'>
                                        Công Thực Tế
                                    </th>
                                    <th className='py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider'>
                                        Tổng Giờ
                                    </th>
                                    <th className='py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider'>
                                        Đi Muộn
                                    </th>
                                    <th className='py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider'>
                                        Thực Lĩnh
                                    </th>
                                    <th className='py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider'>
                                        Quy đổi ETH
                                    </th>
                                    <th className='py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider'>
                                        Trạng thái
                                    </th>
                                    <th className='py-4 px-6 text-center text-xs font-bold text-gray-500 uppercase tracking-wider'></th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-100 text-[8px] md:text-xs'>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className='text-center py-16 text-gray-500 animate-pulse'
                                        >
                                            Đang tải dữ liệu lương...
                                        </td>
                                    </tr>
                                ) : payrolls.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className='text-center py-16'>
                                            <div className='flex flex-col items-center text-gray-400'>
                                                <FileText
                                                    size={48}
                                                    className='mb-2 opacity-50'
                                                />
                                                <p className='mb-2 font-medium'>
                                                    {selectedTimesheet
                                                        ? selectedTimesheet.status ===
                                                          'DRAFT'
                                                            ? 'Chưa có dữ liệu chi tiết'
                                                            : selectedTimesheet.status ===
                                                              'OPEN'
                                                            ? 'Chưa có dữ liệu lương cho timesheet này'
                                                            : 'Không có dữ liệu lương'
                                                        : 'Vui lòng tạo timesheet mới để bắt đầu'}
                                                </p>
                                                {selectedTimesheet &&
                                                    selectedTimesheet.status ===
                                                        'DRAFT' && (
                                                        <p className='text-sm text-gray-500 mb-4'>
                                                            Nhấn nút{' '}
                                                            <strong>
                                                                "Tổng hợp công"
                                                            </strong>{' '}
                                                            ở trên để tính toán chi tiết
                                                            từ attendance và shift
                                                            assignments.
                                                        </p>
                                                    )}
                                                {selectedTimesheet &&
                                                    selectedTimesheet.status ===
                                                        'CLOSED' && (
                                                        <p className='text-sm text-gray-500 mb-4'>
                                                            Timesheet đã được chốt. Không
                                                            thể tính toán lại hoặc chỉnh
                                                            sửa.
                                                        </p>
                                                    )}
                                                {!selectedTimesheet && (
                                                    <button
                                                        onClick={() =>
                                                            setIsCreateModalOpen(true)
                                                        }
                                                        className='mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium'
                                                    >
                                                        <Plus
                                                            size={16}
                                                            className='inline mr-2'
                                                        />
                                                        Tạo Timesheet mới
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    payrolls
                                        .filter((p) =>
                                            p.user?.fullName
                                                ?.toLowerCase()
                                                .includes(searchTerm.toLowerCase())
                                        )
                                        .map((record) => (
                                            <tr
                                                key={record._id}
                                                className='hover:bg-indigo-50/30 transition-colors group border-b border-gray-50'
                                            >
                                                {/* Nhân viên */}
                                                <td className='py-2.5 px-4'>
                                                    <div className='flex items-center gap-2'>
                                                        <div className='w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 border border-indigo-200 shadow-sm text-[10px]'>
                                                            {record.user?.fullName?.charAt(
                                                                0
                                                            ) || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className='text-xs font-bold text-gray-900 leading-tight'>
                                                                {record.user?.fullName ||
                                                                    'Unknown'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Ví ETH */}
                                                <td className='py-2.5 px-4 text-left font-mono text-gray-600'>
                                                    {record.user?.wallet_address ? (
                                                        <div className='flex items-center gap-1.5'>
                                                            <span className='inline-flex items-center px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[10px] font-semibold text-indigo-700'>
                                                                {formatWallet(
                                                                    record.user
                                                                        .wallet_address
                                                                )}
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    handleCopyWallet(
                                                                        record.user
                                                                            ?.wallet_address
                                                                    )
                                                                }
                                                                className='text-gray-400 hover:text-indigo-600 p-0.5 rounded transition-colors'
                                                                title='Sao chép'
                                                            >
                                                                <Copy className='w-3 h-3' />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className='text-[10px] text-gray-400 italic'>
                                                            Chưa cập nhật
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Công thực tế */}
                                                <td className='py-2.5 px-4 text-center'>
                                                    <span className='inline-block px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold text-gray-700 border border-gray-200'>
                                                        {record.total_present_days || 0}{' '}
                                                        công
                                                    </span>
                                                </td>

                                                {/* Tổng giờ */}
                                                <td className='py-2.5 px-4 text-center text-[11px] font-mono font-medium text-gray-600'>
                                                    {(
                                                        record.total_working_hours || 0
                                                    ).toFixed(1)}
                                                    h
                                                </td>

                                                {/* Đi muộn */}
                                                <td className='py-2.5 px-4 text-center'>
                                                    {(record.total_late_minutes || 0) >
                                                    0 ? (
                                                        <span className='inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100'>
                                                            <AlertTriangle size={10} />{' '}
                                                            {record.total_late_minutes ||
                                                                0}
                                                            p
                                                        </span>
                                                    ) : (
                                                        <span className='text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded'>
                                                            Đúng giờ
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Thực lĩnh VND */}
                                                <td className='py-2.5 px-4 text-right'>
                                                    <span className='text-xs font-bold text-gray-900 block'>
                                                        {formatCurrency(
                                                            record.total_amount || 0
                                                        )}
                                                    </span>
                                                    {(record.total_late_minutes || 0) >
                                                        0 && (
                                                        <span className='text-[9px] text-red-500 font-medium bg-red-50 px-1 rounded'>
                                                            Đã trừ phạt
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Quy đổi ETH */}
                                                <td className='py-2.5 px-4 text-right text-xs font-semibold text-indigo-700'>
                                                    {formatEthAmount(
                                                        record.total_amount || 0
                                                    )}
                                                    {!ethExchangeRateVnd && (
                                                        <span className='block text-[9px] text-amber-500 font-medium'>
                                                            Lỗi tỷ giá
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Trạng thái */}
                                                <td className='py-2.5 px-4 text-center'>
                                                    {record.pay_status === 'PAID' ||
                                                    record.approved_at ? (
                                                        <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200'>
                                                            <CheckCircle size={10} /> Đã
                                                            Trả
                                                        </span>
                                                    ) : (
                                                        <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200'>
                                                            <Clock size={10} /> Chờ Trả
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Thao tác */}
                                                <td className='py-2.5 px-4 text-center'>
                                                    {record.pay_status !== 'PAID' &&
                                                    !record.approved_at &&
                                                    selectedTimesheet?.status !==
                                                        'DRAFT' ? (
                                                        <button
                                                            onClick={() =>
                                                                handleApprove(record._id)
                                                            }
                                                            className='bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-md shadow-sm transition-all active:scale-95'
                                                            title='Thanh toán'
                                                        >
                                                            <CreditCard size={14} />
                                                        </button>
                                                    ) : record.approved_at ||
                                                      record.pay_status === 'PAID' ? (
                                                        <div className='flex items-center justify-center gap-1'>
                                                            <span className='text-[10px] text-gray-400 font-mono'>
                                                                {new Date(
                                                                    record.approved_at ||
                                                                        record.updatedAt ||
                                                                        Date.now()
                                                                ).toLocaleDateString(
                                                                    'vi-VN'
                                                                )}
                                                            </span>
                                                            <button
                                                                onClick={() =>
                                                                    openReceipt(
                                                                        record._id
                                                                    )
                                                                }
                                                                className='p-1 rounded text-indigo-600 hover:bg-indigo-50 transition-colors'
                                                                title='Xem biên lai'
                                                            >
                                                                <FileText size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className='text-xs text-gray-400'>
                                                            -
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isCreateModalOpen && (
                <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200'>
                    <div className='bg-white rounded-2xl shadow-2xl max-w-lg w-full'>
                        <div className='p-6 border-b border-gray-200 flex items-start justify-between'>
                            <h2 className='text-xl font-bold text-gray-900'>
                                Tạo Timesheet Mới
                            </h2>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className='text-gray-400 hover:text-red-500 transition-colors'
                            >
                                <X className='h-6 w-6' />
                            </button>
                        </div>

                        <div className='p-6 space-y-5'>
                            <div>
                                <label className='block text-sm font-bold text-gray-700 mb-1'>
                                    Ngày bắt đầu <span className='text-red-500'>*</span>
                                </label>
                                <input
                                    type='date'
                                    value={formData.startDate}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            startDate: e.target.value,
                                        }))
                                    }
                                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all'
                                    required
                                />
                            </div>

                            <div>
                                <label className='block text-sm font-bold text-gray-700 mb-1'>
                                    Ngày kết thúc (tùy chọn)
                                </label>
                                <input
                                    type='date'
                                    value={formData.endDate}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            endDate: e.target.value,
                                        }))
                                    }
                                    min={formData.startDate}
                                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all'
                                />
                                <p className='text-xs text-gray-500 mt-1'>
                                    Để trống nếu chưa xác định ngày kết thúc
                                </p>
                            </div>

                            <div>
                                <label className='block text-sm font-bold text-gray-700 mb-1'>
                                    Ghi chú
                                </label>
                                <textarea
                                    value={formData.note}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            note: e.target.value,
                                        }))
                                    }
                                    rows={3}
                                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none'
                                    placeholder='Nhập ghi chú cho timesheet...'
                                />
                            </div>
                        </div>

                        <div className='p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end space-x-3'>
                            <button
                                type='button'
                                onClick={() => setIsCreateModalOpen(false)}
                                className='px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-white hover:shadow-sm transition-all'
                                disabled={isCreating}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreateTimesheet}
                                disabled={isCreating || !formData.startDate}
                                className='px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed'
                            >
                                {isCreating && (
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                )}
                                {isCreating ? 'Đang tạo...' : 'Tạo Timesheet'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isReceiptModalOpen && currentReceiptDetailId && (
                <PayrollReceiptModal
                    detailId={currentReceiptDetailId}
                    onClose={() => {
                        setIsReceiptModalOpen(false);
                        setCurrentReceiptDetailId(null);
                    }}
                />
            )}
        </div>
    );
};
