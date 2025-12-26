import React, { useEffect, useState, FormEvent, useRef } from 'react';
import {
    Search,
    Filter,
    Plus,
    Edit,
    X,
    RefreshCw,
    QrCode,
    Copy,
    Download,
    Loader2,
    UserCheck,
    Mail,
    Wallet,
    ShieldCheck,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Employee } from '../../types';
import api from '../../services/apiService';
import userService from '../../services/userService';
import toastService from '../../services/toastService';

interface UserResponse {
    _id: string;
    fullName: string;
    email: string;
    position?: string;
    department?: string;
    wallet_address?: string;
    status: 'ACTIVE' | 'INACTIVE';
    role: string;
    createdAt: string;
    avatar?: string;
    company?: string | { _id: string; code: string; name: string };
}

type EmployeeFormState = Omit<Employee, 'id' | 'joinDate'>;

const defaultEmployeeForm: EmployeeFormState = {
    fullName: '',
    email: '',
    walletAddress: '',
    status: 'active',
    avatar: '',
    role: 'STAFF',
    company: '',
};

export const EmployeeManagement: React.FC = () => {
    // ======================= LOGIC (GIỮ NGUYÊN) =======================
    const [employees, setEmployees] = useState<any[]>([]);
    const [roles, setRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState<string>('ALL');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [formData, setFormData] = useState<EmployeeFormState>(defaultEmployeeForm);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [qrEmployee, setQrEmployee] = useState<Employee | null>(null);
    const qrRef = useRef<HTMLDivElement>(null);
    const [realCompanyCode, setRealCompanyCode] = useState<string | null>(null);
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const companyId =
        typeof currentUser?.company === 'string'
            ? currentUser.company
            : currentUser?.company?._id;

    const fetchData = async () => {
        setLoading(true);
        try {
            if (!companyId) {
                setLoading(false);
                return;
            }
            const usersRes = await api.get(`/users/company/id/${companyId}`);
            const rawUsers = Array.isArray(usersRes.data)
                ? usersRes.data
                : usersRes.data?.data || [];
            const mappedEmployees: Employee[] = rawUsers.map((u: UserResponse) => ({
                id: u._id,
                fullName: u.fullName,
                email: u.email,
                walletAddress: u.wallet_address || '',
                status: u.status === 'ACTIVE' ? 'active' : 'inactive',
                joinDate: u.createdAt,
                companyId: u.company,
                role: u.role,
                avatar:
                    u.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        u.fullName
                    )}&background=random&color=fff&bold=true`,
            }));
            setEmployees(mappedEmployees);
            const foundCode =
                currentUser?.companyCode ||
                currentUser?.company?.code ||
                rawUsers[0]?.companyCode;
            if (foundCode) setRealCompanyCode(foundCode);
            try {
                const rolesRes = await userService.getAllRoles();
                setRoles(
                    Array.isArray(rolesRes) && rolesRes.length > 0
                        ? rolesRes
                        : ['ADMIN', 'STAFF']
                );
            } catch (err) {
                setRoles(['ADMIN', 'STAFF']);
            }
        } catch (error) {
            console.error('Lỗi chung:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRoleFilterChange = async (role: string) => {
        setFilterRole(role);
        setLoading(true);
        try {
            if (!companyId) return;
            if (role === 'ALL') {
                await fetchData();
                return;
            }
            const res = await userService.getUsersByRole(role, companyId);
            const mapped = Array.isArray(res)
                ? res.map((u: any) => ({
                      id: u._id || u.id,
                      fullName: u.fullName,
                      email: u.email,
                      walletAddress: u.walletAddress || '',
                      status: u.status === 'ACTIVE' ? 'active' : 'inactive',
                      joinDate: u.createdAt,
                      department: u.department,
                      companyId: u.company,
                      role: u.role,
                      avatar:
                          u.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              u.fullName
                          )}&background=random&color=fff`,
                  }))
                : [];
            setEmployees(mapped);
        } catch (err) {
            toastService.error('Không thể lọc theo vai trò');
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter((employee) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            (employee.fullName?.toLowerCase() || '').includes(searchLower) ||
            (employee.email?.toLowerCase() || '').includes(searchLower);
        const matchesRole = filterRole === 'ALL' || (employee.role || '') === filterRole;
        return matchesSearch && matchesRole;
    });

    const handleOpenModal = (employee: Employee | null) => {
        if (employee) {
            setEditingEmployee(employee);
            setFormData({
                fullName: employee.fullName,
                email: employee.email,
                walletAddress: employee.walletAddress,
                status: employee.status,
                avatar: employee.avatar,
                role: (employee as any).role || 'STAFF',
                company: '',
            });
        } else {
            setEditingEmployee(null);
            setFormData({
                ...defaultEmployeeForm,
                role: roles.includes('STAFF') ? 'STAFF' : roles[0] || 'STAFF',
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEmployee(null);
        setFormData(defaultEmployeeForm);
    };
    const handleOpenQr = (employee: Employee) => {
        setQrEmployee(employee);
        setQrModalOpen(true);
    };

    const downloadQRCode = () => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (canvas && qrEmployee) {
            const url = canvas.toDataURL();
            const a = document.createElement('a');
            a.download = `QR_${qrEmployee.fullName
                .replace(/[^a-z0-9]/gi, '_')
                .toLowerCase()}.png`;
            a.href = url;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleGenerateAvatar = () => {
        const name = formData.fullName || 'User';
        setFormData((prev) => ({
            ...prev,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                name
            )}&background=random&color=fff&size=128&bold=true`,
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formData.role) {
            toastService.error('Vui lòng chọn vai trò!');
            return;
        }
        setIsSubmitting(true);
        try {
            let codeToSend = realCompanyCode;
            if (!codeToSend) {
                const userStr = localStorage.getItem('user');
                const currentUser = userStr ? JSON.parse(userStr) : null;
                codeToSend =
                    currentUser?.companyCode || currentUser?.company?.code || 'HONG';
            }
            const payload = {
                ...formData,
                status: formData.status === 'active' ? 'ACTIVE' : 'INACTIVE',
            };
            if (editingEmployee) {
                await api.patch(`/users/${editingEmployee.id}`, payload);
                toastService.success('Cập nhật thành công!');
            } else {
                await api.post('/users', {
                    ...payload,
                    password: '123456@Default',
                    companyCode: codeToSend,
                    status: 'INACTIVE',
                });
                toastService.success('Thêm nhân viên thành công!');
            }
            await fetchData();
            handleCloseModal();
        } catch (error: any) {
            const msg =
                error?.response?.data?.message || error?.message || 'Có lỗi xảy ra';
            toastService.error(Array.isArray(msg) ? msg.join('\n') : String(msg));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading)
        return (
            <div className='p-10 text-center min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50'>
                <Loader2 className='animate-spin text-indigo-600 w-12 h-12' />
                <p className='text-indigo-900 font-bold uppercase tracking-widest text-xs'>
                    Đang tải dữ liệu nhân sự...
                </p>
            </div>
        );

    return (
        <div className='p-4 bg-slate-50 min-h-screen font-sans selection:bg-indigo-100 selection:text-indigo-900'>
            <div className='max-w-7xl mx-auto'>
                {/* Header - Thu gọn padding và font size */}
                <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 bg-gradient-to-r from-indigo-600 to-blue-500 p-4 rounded-xl shadow-md shadow-blue-200'>
                    <div>
                        <h2 className='text-xl font-black text-white tracking-tight flex items-center gap-2'>
                            <div className='p-1.5 bg-white/20 backdrop-blur-md rounded-lg'>
                                <UserCheck className='h-5 w-5 text-white' />
                            </div>
                            Quản lý Nhân viên
                        </h2>
                        <p className='text-indigo-100 text-[12px] mt-1 font-medium opacity-90 ml-1'>
                            Hệ thống quản lý hồ sơ và phân quyền nhân sự
                        </p>
                    </div>
                    {/* <button
                        onClick={() => handleOpenModal(null)}
                        className='bg-white text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-md font-bold text-xs uppercase tracking-wider active:scale-95'
                    >
                        <Plus className='h-4 w-4' /> <span>Thêm Nhân viên</span>
                    </button> */}
                </div>

                {/* Toolbar - Nhỏ gọn hơn */}
                <div className='bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 relative overflow-hidden'>
                    <div className='absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'></div>

                    <div className='flex-1 max-w-sm relative group'>
                        <Search
                            className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors'
                            size={16}
                        />
                        <input
                            type='text'
                            placeholder='Tìm tên hoặc email...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='w-full pl-9 pr-3 py-2 bg-slate-50 border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 rounded-xl outline-none transition-all font-medium text-xs'
                        />
                    </div>

                    <div className='flex items-center gap-2'>
                        <div className='flex items-center space-x-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 focus-within:bg-white focus-within:border-indigo-500 transition-all'>
                            <Filter className='h-3.5 w-3.5 text-indigo-500' />
                            <select
                                value={filterRole}
                                onChange={(e) => handleRoleFilterChange(e.target.value)}
                                className='bg-transparent outline-none text-[12px] font-bold text-slate-700 cursor-pointer min-w-[120px]'
                            >
                                <option value='ALL'>Tất cả Vai trò</option>
                                {roles.map((r) => (
                                    <option key={r} value={r}>
                                        {r === 'ADMIN'
                                            ? 'Quản lý'
                                            : r === 'STAFF'
                                            ? 'Nhân viên'
                                            : r}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Section - Tối ưu khoảng cách dòng */}
                <div className='bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='w-full text-left'>
                            <thead>
                                <tr className='bg-slate-50/50 border-b border-slate-100'>
                                    <th className='p-3 pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400'>
                                        Nhân viên
                                    </th>
                                    <th className='p-3 text-[10px] font-black uppercase tracking-widest text-slate-400'>
                                        Liên hệ
                                    </th>
                                    <th className='p-3 text-[10px] font-black uppercase tracking-widest text-slate-400'>
                                        Quyền
                                    </th>
                                    <th className='p-3 text-[10px] font-black uppercase tracking-widest text-slate-400'>
                                        Ví
                                    </th>
                                    <th className='p-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center'>
                                        Trạng thái
                                    </th>
                                    <th className='p-3 pr-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right'>
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-slate-50'>
                                {filteredEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className='py-12 text-center'>
                                            <div className='flex flex-col items-center justify-center text-slate-400'>
                                                <Loader2
                                                    size={32}
                                                    className='mb-2 opacity-20'
                                                />
                                                <p className='text-sm font-bold'>
                                                    Không tìm thấy dữ liệu
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEmployees.map((employee) => (
                                        <tr
                                            key={employee.id}
                                            className='group hover:bg-indigo-50/30 transition-all duration-200'
                                        >
                                            <td className='p-3 pl-8'>
                                                <div className='flex items-center space-x-3'>
                                                    <img
                                                        src={employee.avatar}
                                                        alt='avatar'
                                                        className='w-9 h-9 rounded-xl object-cover border border-white shadow-sm group-hover:scale-105 transition-transform'
                                                    />
                                                    <div>
                                                        <p className='text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors'>
                                                            {employee.fullName}
                                                        </p>
                                                        <p className='text-[9px] text-slate-400 font-black uppercase mt-0.5'>
                                                            ID:{' '}
                                                            {employee.id
                                                                .slice(-6)
                                                                .toUpperCase()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className='p-3'>
                                                <div className='flex items-center gap-1.5 text-slate-600'>
                                                    <Mail
                                                        size={12}
                                                        className='text-indigo-400'
                                                    />
                                                    <span className='text-xs font-medium'>
                                                        {employee.email}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className='p-3'>
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase border shadow-sm ${
                                                        employee.role === 'ADMIN'
                                                            ? 'bg-violet-50 text-violet-700 border-violet-100'
                                                            : 'bg-slate-50 text-slate-600 border-slate-100'
                                                    }`}
                                                >
                                                    <ShieldCheck size={10} />
                                                    {employee.role === 'ADMIN'
                                                        ? 'Quản lý'
                                                        : 'Nhân viên'}
                                                </span>
                                            </td>
                                            <td className='p-3'>
                                                <div className='flex items-center gap-1.5'>
                                                    <Wallet
                                                        size={12}
                                                        className='text-indigo-400'
                                                    />
                                                    <span className='font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200'>
                                                        {employee.walletAddress
                                                            ? `${employee.walletAddress.slice(
                                                                  0,
                                                                  4
                                                              )}...${employee.walletAddress.slice(
                                                                  -4
                                                              )}`
                                                            : '-'}
                                                    </span>
                                                    {employee.walletAddress && (
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(
                                                                    employee.walletAddress
                                                                );
                                                                toastService.success(
                                                                    'Đã sao chép'
                                                                );
                                                            }}
                                                            className='text-slate-300 hover:text-indigo-600 p-1 hover:bg-indigo-50 rounded transition-all'
                                                        >
                                                            <Copy size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className='p-3 text-center'>
                                                <span
                                                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-full border shadow-sm ${
                                                        employee.status === 'active'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                            : 'bg-rose-50 text-rose-700 border-rose-100'
                                                    }`}
                                                >
                                                    {employee.status === 'active'
                                                        ? 'Hoạt động'
                                                        : 'Đã nghỉ'}
                                                </span>
                                            </td>
                                            <td className='p-3 pr-8 text-right'>
                                                <div className='flex items-center justify-end gap-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all'>
                                                    <button
                                                        onClick={() =>
                                                            handleOpenQr(employee)
                                                        }
                                                        className='p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-lg transition-all'
                                                        title='Mã QR'
                                                    >
                                                        <QrCode size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleOpenModal(employee)
                                                        }
                                                        className='p-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-md transition-all active:scale-90'
                                                        title='Sửa'
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal Form - Nhỏ gọn và tinh tế */}
                {isModalOpen && (
                    <div className='fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300'>
                        <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col max-h-[90vh] overflow-hidden border border-white'>
                            <form
                                onSubmit={handleSubmit}
                                className='flex flex-col h-full'
                            >
                                <div className='p-5 bg-gradient-to-r from-indigo-600 to-violet-600 flex items-start justify-between'>
                                    <div>
                                        <h2 className='text-lg font-black text-white uppercase tracking-tight'>
                                            {editingEmployee
                                                ? 'Cập nhật Hồ sơ'
                                                : 'Thêm Nhân viên'}
                                        </h2>
                                        <p className='text-indigo-100 text-[10px] font-bold opacity-80 uppercase tracking-widest'>
                                            Vietnam HR Standard
                                        </p>
                                    </div>
                                    <button
                                        type='button'
                                        onClick={handleCloseModal}
                                        className='text-white/60 hover:text-white bg-white/10 p-1.5 rounded-full transition-all'
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className='p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar bg-slate-50/50'>
                                    <div className='flex items-center space-x-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm'>
                                        <img
                                            src={
                                                formData.avatar ||
                                                `https://ui-avatars.com/api/?name=${
                                                    formData.fullName || 'User'
                                                }&background=random`
                                            }
                                            alt='Preview'
                                            className='w-14 h-14 rounded-xl object-cover border-2 border-indigo-50 shadow-md'
                                        />
                                        <div className='flex-1'>
                                            <label className='block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1'>
                                                Ảnh (URL)
                                            </label>
                                            <div className='flex gap-1.5'>
                                                <input
                                                    type='text'
                                                    name='avatar'
                                                    value={formData.avatar}
                                                    onChange={handleChange}
                                                    className='flex-1 px-3 py-1.5 bg-slate-50 border-transparent focus:border-indigo-500 focus:bg-white rounded-lg text-xs outline-none transition-all font-bold'
                                                    placeholder='Link URL...'
                                                />
                                                <button
                                                    type='button'
                                                    onClick={handleGenerateAvatar}
                                                    className='p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100'
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className='grid grid-cols-1 gap-4'>
                                        <div>
                                            <label className='block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1'>
                                                Họ và tên *
                                            </label>
                                            <input
                                                type='text'
                                                name='fullName'
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                className='w-full px-4 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-none transition-all font-bold text-sm text-slate-700'
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className='block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1'>
                                                Email *
                                            </label>
                                            <input
                                                type='email'
                                                name='email'
                                                value={formData.email}
                                                onChange={handleChange}
                                                className='w-full px-4 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl outline-none transition-all font-bold text-sm text-slate-700'
                                                required
                                            />
                                        </div>
                                        <div className='grid grid-cols-2 gap-3'>
                                            <div>
                                                <label className='block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1'>
                                                    Vai trò *
                                                </label>
                                                <select
                                                    name='role'
                                                    value={formData.role}
                                                    onChange={handleChange}
                                                    className='w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-700'
                                                    required
                                                >
                                                    <option value=''>Chọn</option>
                                                    {roles.map((r) => (
                                                        <option key={r} value={r}>
                                                            {r === 'ADMIN'
                                                                ? 'Quản lý'
                                                                : 'Nhân viên'}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className='block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1'>
                                                    Trạng thái
                                                </label>
                                                <select
                                                    name='status'
                                                    value={formData.status}
                                                    onChange={handleChange}
                                                    className='w-full px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-700'
                                                >
                                                    <option value='active'>
                                                        Đang làm việc
                                                    </option>
                                                    <option value='inactive'>
                                                        Đã nghỉ việc
                                                    </option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className='block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 ml-1'>
                                                Ví Blockchain
                                            </label>
                                            <input
                                                type='text'
                                                name='walletAddress'
                                                value={formData.walletAddress}
                                                onChange={handleChange}
                                                className='w-full px-4 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs outline-none transition-all font-bold'
                                                placeholder='0x...'
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className='p-5 bg-white border-t border-slate-100 flex justify-end space-x-3'>
                                    <button
                                        type='button'
                                        onClick={handleCloseModal}
                                        className='px-4 py-2 text-slate-500 font-bold text-[11px] uppercase tracking-widest hover:bg-slate-50 rounded-lg transition-all'
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type='submit'
                                        disabled={isSubmitting}
                                        className='px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2 active:scale-95 disabled:opacity-70'
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className='w-3 h-3 animate-spin' />
                                        ) : editingEmployee ? (
                                            'Cập nhật'
                                        ) : (
                                            'Thêm mới'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* QR Modal - Nhỏ gọn hơn */}
                {qrModalOpen && qrEmployee && (
                    <div className='fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in zoom-in duration-300'>
                        <div className='bg-white rounded-3xl shadow-2xl max-w-xs w-full text-center p-6 relative overflow-hidden border border-white'>
                            <div className='absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'></div>
                            <button
                                onClick={() => setQrModalOpen(false)}
                                className='absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-all'
                            >
                                <X size={18} />
                            </button>

                            <h3 className='text-lg font-black text-slate-900 mb-4 uppercase tracking-tight'>
                                Thẻ QR Nhân Viên
                            </h3>

                            <div
                                className='flex justify-center mb-4 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200'
                                ref={qrRef}
                            >
                                <QRCodeCanvas
                                    value={qrEmployee.id}
                                    size={160}
                                    level={'H'}
                                    includeMargin={true}
                                />
                            </div>

                            <div className='mb-6'>
                                <p className='font-black text-slate-800 text-lg tracking-tight'>
                                    {qrEmployee.fullName}
                                </p>
                                <p className='text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70 italic'>
                                    Blockchain Verified
                                </p>
                            </div>

                            <button
                                onClick={downloadQRCode}
                                className='w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:from-indigo-700 transition-all font-black uppercase text-[10px] tracking-widest shadow-md active:scale-95'
                            >
                                <Download className='w-4 h-4 mr-2 inline' /> Tải mã PNG
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
