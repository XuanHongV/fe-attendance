import { FormEvent, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import { registerAdmin, reset } from "../../store/slices/authSlice";

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const { isLoading, isError, isSuccess, message } = useSelector(
    (state: RootState) => state.auth
  );

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    phone: "",
    adminFullName: "",
    adminEmail: "",
    adminPassword: "",
    confirmPassword: ""
  });
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (isError) {
      setLocalError(message); 
      setTimeout(() => dispatch(reset()), 5000);
    }
    if (isSuccess) {
      alert(message); 
      dispatch(reset());
      navigate("/login");
    }
  }, [isError, isSuccess, message, navigate, dispatch]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (formData.adminPassword !== formData.confirmPassword) {
      setLocalError("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (formData.code.length < 4) {
      setLocalError("Mã công ty phải có ít nhất 4 ký tự");
      return;
    }

    const payload = {
      name: formData.name,
      code: formData.code.toUpperCase(),
      adminEmail: formData.adminEmail,
      phone: formData.phone,
      adminPassword: formData.adminPassword,
      adminFullName: formData.adminFullName,
    };

    dispatch(registerAdmin(payload));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white p-6 rounded-2xl shadow-lg my-10">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Đăng ký Doanh nghiệp</h1>

        {(localError || isError) && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center border border-red-200">
            {localError || message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 font-semibold text-blue-600 border-b pb-2">Thông tin Công ty</div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Tên Công ty <span className="text-red-500">*</span></label>
            <input name="name" type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
              value={formData.name} onChange={handleChange} required placeholder="Vd: Công ty TNHH ABC" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mã Công ty <span className="text-red-500">*</span></label>
            <input name="code" type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 uppercase" 
              value={formData.code} onChange={handleChange} required placeholder="Vd: ABCGROUP" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Số điện thoại <span className="text-red-500">*</span></label>
            <input name="phone" type="tel" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
              value={formData.phone} onChange={handleChange} required placeholder="0905 xxx xxx" />
          </div>

          <div className="md:col-span-2 font-semibold text-blue-600 border-b pb-2 mt-4">Thông tin Quản trị viên</div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Họ và tên Admin <span className="text-red-500">*</span></label>
            <input name="adminFullName" type="text" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
              value={formData.adminFullName} onChange={handleChange} required placeholder="Nguyễn Văn A" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Email đăng nhập <span className="text-red-500">*</span></label>
            <input name="adminEmail" type="email" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
              value={formData.adminEmail} onChange={handleChange} required placeholder="admin@abc.com" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mật khẩu <span className="text-red-500">*</span></label>
            <input name="adminPassword" type="password" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
              value={formData.adminPassword} onChange={handleChange} required minLength={8} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
            <input name="confirmPassword" type="password" className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
              value={formData.confirmPassword} onChange={handleChange} required />
          </div>

          <div className="md:col-span-2 mt-4">
            <button disabled={isLoading} className="w-full rounded-xl py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition disabled:opacity-70">
              {isLoading ? "Đang xử lý..." : "Đăng ký Hệ thống"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm space-y-3">
            <p>
                Bạn đã có tài khoản?{' '}
                <Link to="/login" className="text-blue-600 font-bold hover:underline">
                    Đăng nhập
                </Link>
            </p>
                   <p className="text-gray-600">
                Bạn là nhân viên muốn gia nhập công ty?{' '}
                <Link to="/register-employee" className="text-green-600 font-bold hover:underline">
                    Đăng ký Nhân viên
                </Link>
            </p>
        </div>

      </div>
    </div>
  );
}