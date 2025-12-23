import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "./store/store";
import { logoutUser } from "./store/slices/authSlice";
import { Header } from "./components/Layout/Header";
import { Sidebar } from "./components/Layout/Sidebar";
import { Menu } from "lucide-react";
import Register from "./components/Auth/Register";
import RegisterEmployee from "./components/Auth/RegisterEmployee";
import Login from "./components/Auth/Login";
import Dashboard from "./components/Dashboard/Dashboard";
import { EmployeeManagement } from "./components/Employees/EmployeeManagement";
import { PositionManagement } from "./components/Positions/PositionManagement";
import { PayrollManagement } from "./components/Payroll/PayrollManagement";
import { AttendanceManagement } from "./components/Attendance/AttendanceManagement";
import { ShiftManagement } from "./components/Shifts/ShiftManagement";
import { ScheduleManagement } from "./components/Schedule/ScheduleManagement";
import { StaffShift } from "./components/Staff/StaffShift";
import { Timekeeping } from "./components/Staff/Timekeeping";
import { MyPayroll } from "./components/Staff/MyPayroll";
import QRDisplay from "./components/Attendance/QRDisplay";

// Toast notifications
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "react-confirm-alert/src/react-confirm-alert.css";

const PrivateLayout = () => {
  const { accessToken, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };
  const currentPath = location.pathname.startsWith("/")
    ? location.pathname.substring(1)
    : location.pathname;

  const handleTabChange = (tabName: string) => {
    const path = tabName.startsWith("/") ? tabName : `/${tabName}`;
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar
        activeTab={currentPath}
        onTabChange={handleTabChange}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <span className="font-bold text-gray-800 text-lg">
              Payroll System
            </span>
          </div>
        </div>

        <div className="hidden md:block flex-shrink-0">
          <Header user={user} onLogout={handleLogout} />
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6 scroll-smooth">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={4000} />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-employee" element={<RegisterEmployee />} />
        <Route element={<PrivateLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/employees" element={<EmployeeManagement />} />
          <Route path="/positions" element={<PositionManagement />} />
          <Route path="/shifts" element={<ShiftManagement />} />
          <Route path="/schedule" element={<ScheduleManagement />} />
          <Route path="/attendance" element={<AttendanceManagement />} />
          <Route path="/payroll" element={<PayrollManagement />} />
          <Route path="/staff/shift" element={<StaffShift />} />
          <Route path="/staff/timekeeping" element={<Timekeeping />} />
          <Route path="/staff/payroll" element={<MyPayroll />} />
          <Route
            path="/staff"
            element={<Navigate to="/staff/shift" replace />}
          />
          <Route
            path="/settings"
            element={
              <div className="p-6 text-gray-500">
                Trang Cài đặt đang được xây dựng...
              </div>
            }
          />
          <Route path="/shifts/qr/:id" element={<QRDisplay />} />
        </Route>
        <Route
          path="*"
          element={
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-500">
              <h1 className="text-4xl font-bold mb-2">404</h1>
              <p>Trang không tồn tại</p>
              <a href="/" className="mt-4 text-blue-600 hover:underline">
                Quay về trang chủ
              </a>
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default App;
