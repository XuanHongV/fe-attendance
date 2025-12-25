import { FormEvent, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { loginUser, reset } from '../../store/slices/authSlice';
import {
    Building2,
    Mail,
    Lock,
    LogIn,
    Loader2,
    AlertCircle,
    ArrowRight,
} from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { isLoading, isError, message, user, accessToken } = useSelector(
        (state: RootState) => state.auth
    );

    const [code, setCode] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        // Logic điều hướng giữ nguyên
        if (accessToken && user) {
            const redirectPath = user.role === 'ADMIN' ? '/dashboard' : '/staff/';
            navigate(redirectPath, { replace: true });
        } else {
            dispatch(reset());
        }
    }, [user, accessToken, navigate, dispatch]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        dispatch(
            loginUser({
                code: code.toUpperCase(),
                email: email,
                password: password,
            })
        );
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-sans selection:bg-indigo-100 selection:text-indigo-900'>
            <div className='w-full max-w-[420px]'>
                {/* Logo/Brand Area */}
                <div className='text-center mb-8'>
                    <div className='inline-flex p-3 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-2xl shadow-lg shadow-indigo-200 mb-4 transform hover:rotate-6 transition-transform'>
                        <LogIn className='h-8 w-8 text-white' />
                    </div>
                    <h1 className='text-2xl font-black text-slate-900 tracking-tight uppercase'>
                        Đăng nhập
                    </h1>
                    <p className='text-slate-500 text-sm font-medium mt-1'>
                        Hệ thống quản lý Blockchain HR
                    </p>
                </div>

                {/* Login Card */}
                <div className='bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/60 border border-white relative overflow-hidden'>
                    {/* Decorative line */}
                    <div className='absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500'></div>

                    {isError && (
                        <div className='bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl mb-6 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1'>
                            <AlertCircle size={16} />
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className='space-y-5'>
                        {/* Mã Công ty */}
                        <div className='space-y-1.5'>
                            <label className='text-[11px] font-black text-slate-400 uppercase ml-1 tracking-widest'>
                                Mã Công ty
                            </label>
                            <div className='relative group'>
                                <Building2
                                    className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors'
                                    size={18}
                                />
                                <input
                                    type='text'
                                    className='w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl pl-11 pr-4 py-2.5 outline-none transition-all font-bold text-slate-700 placeholder:font-normal uppercase'
                                    value={code}
                                    onChange={(e) =>
                                        setCode(e.target.value.toUpperCase())
                                    }
                                    required
                                    placeholder='VD: ABCGROUP'
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className='space-y-1.5'>
                            <label className='text-[11px] font-black text-slate-400 uppercase ml-1 tracking-widest'>
                                Email
                            </label>
                            <div className='relative group'>
                                <Mail
                                    className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors'
                                    size={18}
                                />
                                <input
                                    type='email'
                                    className='w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl pl-11 pr-4 py-2.5 outline-none transition-all font-bold text-slate-700 placeholder:font-normal'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete='off'
                                    placeholder='admin@company.com'
                                />
                            </div>
                        </div>

                        {/* Mật khẩu */}
                        <div className='space-y-1.5'>
                            <label className='text-[11px] font-black text-slate-400 uppercase ml-1 tracking-widest'>
                                Mật khẩu
                            </label>
                            <div className='relative group'>
                                <Lock
                                    className='absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors'
                                    size={18}
                                />
                                <input
                                    type='password'
                                    className='w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-xl pl-11 pr-4 py-2.5 outline-none transition-all font-bold text-slate-700 placeholder:font-normal'
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete='off'
                                    placeholder='••••••••'
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type='submit'
                            disabled={isLoading}
                            className='w-full group bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl py-3 font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2 mt-4'
                        >
                            {isLoading ? (
                                <Loader2 className='animate-spin h-5 w-5' />
                            ) : (
                                <>
                                    Truy cập hệ thống
                                    <ArrowRight
                                        size={16}
                                        className='group-hover:translate-x-1 transition-transform'
                                    />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Links */}
                <div className='mt-8 text-center space-y-4'>
                    <div className='bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/50'>
                        <p className='text-[11px] font-bold text-slate-500 uppercase tracking-tight mb-2'>
                            Bạn chưa có tài khoản?
                        </p>
                        <div className='flex flex-col gap-2'>
                            <Link
                                to='/register'
                                className='text-xs font-black text-indigo-600 hover:text-indigo-800 transition uppercase tracking-wider'
                            >
                                Đăng ký Doanh nghiệp mới
                            </Link>
                            <div className='h-px bg-slate-200 w-12 mx-auto'></div>
                            <Link
                                to='/register-employee'
                                className='text-xs font-black text-emerald-600 hover:text-emerald-800 transition uppercase tracking-wider'
                            >
                                Đăng ký vào Công ty (Nhân viên)
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
