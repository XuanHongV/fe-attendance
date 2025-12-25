import { FormEvent, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { registerAdmin, reset } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';
import {
    Building2,
    UserCircle,
    Wallet,
    Lock,
    Mail,
    Phone,
    Fingerprint,
    ArrowRight,
    Loader2,
    Building,
    X,
} from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { isLoading, isError, isSuccess, message } = useSelector(
        (state: RootState) => state.auth
    );

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        phone: '',
        adminFullName: '',
        adminEmail: '',
        adminPassword: '',
        confirmPassword: '',
        treasury_wallet: '',
        treasury_private_key: '',
    });
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (isError) {
            toast.error(message || 'Đã có lỗi xảy ra!');
            setTimeout(() => dispatch(reset()), 5000);
        }
        if (isSuccess) {
            toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
            dispatch(reset());
            navigate('/login');
        }
    }, [isError, isSuccess, message, navigate, dispatch]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (formData.adminPassword !== formData.confirmPassword) {
            setLocalError('Mật khẩu xác nhận không khớp!');
            return;
        }
        if (formData.code.length < 4) {
            setLocalError('Mã công ty phải có ít nhất 4 ký tự');
            return;
        }

        const payload = {
            name: formData.name,
            code: formData.code.toUpperCase(),
            adminEmail: formData.adminEmail,
            phone: formData.phone,
            adminPassword: formData.adminPassword,
            adminFullName: formData.adminFullName,
            treasury_wallet: formData.treasury_wallet,
            treasury_private_key: formData.treasury_private_key,
        };

        dispatch(registerAdmin(payload));
        setFormData({
            name: '',
            code: '',
            phone: '',
            adminFullName: '',
            adminEmail: '',
            adminPassword: '',
            confirmPassword: '',
            treasury_wallet: '',
            treasury_private_key: '',
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-[#F4F7FA] p-2 md:p-4 font-sans selection:bg-indigo-100'>
            <div className='w-full max-w-xl bg-white rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden border border-white'>
                {/* Header Banner - Đã thu nhỏ p-8 -> p-4 */}
                <div className='bg-gradient-to-r from-indigo-600 to-indigo-800 p-4 text-center text-white relative'>
                    <div className='absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 blur-xl'></div>
                    <div className='inline-flex p-2 bg-white/10 backdrop-blur-md rounded-xl mb-1'>
                        <Building size={20} className='text-white' />
                    </div>
                    <h1 className='text-lg font-black tracking-tight uppercase'>
                        Đăng ký Doanh nghiệp
                    </h1>
                    <p className='text-indigo-100 text-[11px] font-medium opacity-80'>
                        Khởi tạo hệ thống quản lý Blockchain công ty
                    </p>
                </div>

                <div className='p-4 md:p-6'>
                    {(localError || isError) && (
                        <div className='bg-rose-50 text-rose-600 p-2.5 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 border border-rose-100 animate-pulse'>
                            <div className='p-1 bg-rose-500 text-white rounded-full'>
                                <X size={10} />
                            </div>
                            {localError || message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className='space-y-4'>
                        {/* Section 1: Company Info */}
                        <div className='space-y-3'>
                            <div className='flex items-center gap-2 text-indigo-600'>
                                <Building2 size={16} strokeWidth={2.5} />
                                <span className='text-[10px] font-black uppercase tracking-widest'>
                                    Thông tin Công ty
                                </span>
                                <div className='h-px bg-indigo-50 flex-1 ml-1'></div>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                <div className='space-y-1'>
                                    <label className='text-[10px] font-black text-slate-400 uppercase ml-1'>
                                        Tên Công ty
                                    </label>
                                    <input
                                        name='name'
                                        type='text'
                                        required
                                        className='w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2 outline-none transition-all font-bold text-xs text-slate-700'
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder='Cty TNHH ABC'
                                    />
                                </div>

                                <div className='space-y-1'>
                                    <label className='text-[10px] font-black text-slate-400 uppercase ml-1'>
                                        Mã định danh
                                    </label>
                                    <input
                                        name='code'
                                        type='text'
                                        required
                                        className='w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2 outline-none transition-all font-black text-xs text-indigo-600 uppercase'
                                        value={formData.code}
                                        onChange={handleChange}
                                        placeholder='ABC_CORP'
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Admin & Blockchain Info */}
                        <div className='space-y-3'>
                            <div className='flex items-center gap-2 text-indigo-600'>
                                <UserCircle size={16} strokeWidth={2.5} />
                                <span className='text-[10px] font-black uppercase tracking-widest'>
                                    Quản trị & Blockchain
                                </span>
                                <div className='h-px bg-indigo-50 flex-1 ml-1'></div>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                                <div className='md:col-span-2 space-y-1'>
                                    <label className='text-[10px] font-black text-slate-400 uppercase ml-1'>
                                        Số điện thoại & Họ tên Admin
                                    </label>
                                    <div className='flex gap-2'>
                                        <input
                                            name='phone'
                                            type='tel'
                                            required
                                            className='w-[40%] bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2 outline-none text-xs font-bold text-slate-700'
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder='SĐT'
                                        />
                                        <input
                                            name='adminFullName'
                                            type='text'
                                            required
                                            className='flex-1 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2 outline-none text-xs font-bold text-slate-700'
                                            value={formData.adminFullName}
                                            onChange={handleChange}
                                            placeholder='Tên Admin'
                                        />
                                    </div>
                                </div>

                                <div className='space-y-1'>
                                    <label className='text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1'>
                                        <Wallet size={10} /> Địa chỉ Ví
                                    </label>
                                    <input
                                        name='treasury_wallet'
                                        type='text'
                                        required
                                        className='w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2 outline-none font-mono text-[10px] font-bold text-slate-600'
                                        value={formData.treasury_wallet}
                                        onChange={handleChange}
                                        placeholder='0x...'
                                    />
                                </div>

                                <div className='space-y-1'>
                                    <label className='text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-1'>
                                        <Fingerprint size={10} /> Private Key
                                    </label>
                                    <input
                                        name='treasury_private_key'
                                        type='password'
                                        required
                                        className='w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2 outline-none font-mono text-[10px] font-bold text-slate-600'
                                        value={formData.treasury_private_key}
                                        onChange={handleChange}
                                        placeholder='••••'
                                    />
                                </div>

                                <div className='md:col-span-2 space-y-1'>
                                    <label className='text-[10px] font-black text-slate-400 uppercase ml-1'>
                                        Email đăng nhập
                                    </label>
                                    <input
                                        name='adminEmail'
                                        type='email'
                                        required
                                        className='w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2 outline-none text-xs font-bold text-slate-700'
                                        value={formData.adminEmail}
                                        onChange={handleChange}
                                        placeholder='admin@gmail.com'
                                    />
                                </div>

                                <div className='space-y-1'>
                                    <label className='text-[10px] font-black text-slate-400 uppercase ml-1'>
                                        Mật khẩu
                                    </label>
                                    <input
                                        name='adminPassword'
                                        type='password'
                                        required
                                        minLength={8}
                                        className='w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2 outline-none text-xs font-bold text-slate-700'
                                        value={formData.adminPassword}
                                        onChange={handleChange}
                                        placeholder='••••••••'
                                    />
                                </div>

                                <div className='space-y-1'>
                                    <label className='text-[10px] font-black text-slate-400 uppercase ml-1'>
                                        Xác nhận
                                    </label>
                                    <input
                                        name='confirmPassword'
                                        type='password'
                                        required
                                        className='w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-3 py-2 outline-none text-xs font-bold text-slate-700'
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder='••••••••'
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className='pt-2'>
                            <button
                                disabled={isLoading}
                                className='w-full group bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white rounded-xl py-3 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2'
                            >
                                {isLoading ? (
                                    <Loader2 className='animate-spin h-4 w-4' />
                                ) : (
                                    <>
                                        Xác nhận Đăng ký{' '}
                                        <ArrowRight
                                            size={14}
                                            className='group-hover:translate-x-1 transition-transform'
                                        />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Footer Links - Thu nhỏ margin-top */}
                    <div className='mt-5 flex flex-col gap-2 text-center border-t border-slate-50 pt-4'>
                        <p className='text-[11px] font-medium text-slate-500'>
                            Đã có tài khoản?{' '}
                            <Link
                                to='/login'
                                className='text-indigo-600 font-black hover:underline ml-1 uppercase text-[10px]'
                            >
                                Đăng nhập
                            </Link>
                        </p>
                        <p className='text-[10px] font-bold text-slate-400 uppercase tracking-tighter'>
                            Nhân viên?{' '}
                            <Link
                                to='/register-employee'
                                className='text-emerald-600 font-black hover:text-emerald-700 ml-1'
                            >
                                Gia nhập công ty tại đây
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
