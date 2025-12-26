import { FormEvent, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store/store';
import { registerEmployee, reset } from '../../store/slices/authSlice';
import { toast } from "react-toastify";

export default function RegisterEmployee() {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { isLoading, isError, isSuccess, message } = useSelector(
        (state: RootState) => state.auth
    );

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        // hash: "",
        email: '',
        wallet_address: '',
        password: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (isSuccess) {
            // alert(message);
            toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
            dispatch(reset());
            navigate('/login');
        }
        if (isError) {
            toast.error(message || 'Đã có lỗi xảy ra!');
            const timer = setTimeout(() => dispatch(reset()), 5000);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, isError, message, navigate, dispatch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert('Mật khẩu xác nhận không khớp!');
            return;
        }

        const payload = {
            fullName: formData.name,
            companyCode: formData.code.toUpperCase(),
            email: formData.email,
            password: formData.password,
            wallet_address: formData.wallet_address,
        };

        dispatch(registerEmployee(payload));
    };

    return (
        <div className='min-h-screen flex bg-white'>
            <div className='w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto'>
                <div className='w-full max-w-lg space-y-6 bg-white p-8 rounded-2xl shadow-xl my-4'>
                    <div className='text-center'>
                        <h2 className='text-3xl font-extrabold text-blue-700'>
                            Đăng ký Nhân viên
                        </h2>
                        <p className='mt-2 text-sm text-gray-600'>
                            Nhập mã doanh nghiệp để gia nhập.
                        </p>
                    </div>

                    {isError && (
                        <div className='bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded text-sm mb-4'>
                            <p className='font-bold'>Lỗi:</p>
                            <p>{message}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className='space-y-4'>
                        <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
                            <label className='block text-sm font-bold text-blue-800 mb-1'>
                                Mã Công ty <span className='text-red-500'>*</span>
                            </label>
                            <input
                                name='code'
                                value={formData.code}
                                onChange={handleChange}
                                required
                                className='w-full border-2 border-blue-300 rounded-lg py-2.5 px-3 uppercase font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                placeholder='VD: ABCGROUP'
                            />
                        </div>

                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Họ và tên
                            </label>
                            <input
                                name='name'
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className='w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-blue-500 outline-none'
                                placeholder='Nguyễn Văn A'
                            />
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Email cá nhân
                                </label>
                                <input
                                    name='email'
                                    type='email'
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className='w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-blue-500 outline-none'
                                    placeholder='nv@email.com'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Ví điện tử{' '}
                                </label>
                                <input
                                    name='wallet_address'
                                    type='tel'
                                    value={formData.wallet_address}
                                    onChange={handleChange}
                                    required
                                    className='w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-blue-500 outline-none'
                                    placeholder='09xx...'
                                />
                            </div>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Mật khẩu
                                </label>
                                <input
                                    name='password'
                                    type='password'
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={6}
                                    className='w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-blue-500 outline-none'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Xác nhận MK
                                </label>
                                <input
                                    name='confirmPassword'
                                    type='password'
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className='w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-blue-500 outline-none'
                                />
                            </div>
                        </div>

                        <button
                            disabled={isLoading}
                            className='w-full py-3 px-4 rounded-lg shadow-md font-bold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-70 mt-4'
                        >
                            {isLoading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu tham gia'}
                        </button>

                        <div className='text-center mt-4 space-y-2'>
                            <p className='text-sm text-gray-600'>
                                Đã có tài khoản?{' '}
                                <Link
                                    to='/login'
                                    className='font-bold text-blue-600 hover:underline'
                                >
                                    Đăng nhập
                                </Link>
                            </p>
                            <p className='text-sm text-gray-500'>
                                Mở công ty mới?{' '}
                                <Link
                                    to='/register'
                                    className='font-medium text-gray-700 hover:underline'
                                >
                                    Đăng ký Doanh nghiệp
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
            <div
                className='hidden lg:flex w-1/2 bg-cover bg-center relative'
                style={{
                    backgroundImage:
                        "url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')",
                }}
            >
                <div className='absolute inset-0 bg-blue-900 bg-opacity-50'></div>
                <div className='relative z-10 flex flex-col justify-center px-12 text-white text-right'>
                    <h2 className='text-4xl font-bold mb-4'>Join the Team</h2>
                    <p className='text-lg opacity-90'>Kết nối và làm việc hiệu quả.</p>
                </div>
            </div>
        </div>
    );
}
