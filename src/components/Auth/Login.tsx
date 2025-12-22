import { FormEvent, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import { loginUser, reset } from "../../store/slices/authSlice";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { isLoading, isError, message, user, accessToken } = useSelector(
    (state: RootState) => state.auth
  );

  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    //Nếu đã có Token và User -> trang chính
    if (accessToken && user) {
      const redirectPath = user.role === 'ADMIN' ? "/dashboard" : "/staff/";

      navigate(redirectPath, { replace: true });
    } else {
      dispatch(reset());
    }
  }, [user, accessToken, navigate, dispatch]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch(loginUser({
      code: code.toUpperCase(),
      email: email,
      password: password
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Đăng nhập Hệ thống</h1>

        {isError && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã Công ty</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              placeholder="VD: ABCGROUP"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-70 mt-2 flex justify-center items-center"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "Đăng nhập"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Bạn chưa có tài khoản?{' '}
            <Link
              to="/register"
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition"
            >
              Đăng ký Doanh nghiệp mới
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            Nhân viên mới?{' '}
            <Link
              to="/register-employee"
              className="font-medium text-green-600 hover:text-green-800 hover:underline transition">
              Đăng ký vào Công ty
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}