import React, { useEffect, useState, FormEvent } from "react";
import {
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  Edit,
  X,
  Plus,
} from "lucide-react";
import api from "../../services/apiService";

/* =======================
   TYPES
======================= */
type AttendanceStatus = "PRESENT" | "LATE" | "DONE" | "ABSENT";

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
   HELPERS
======================= */
const getStatusProps = (status: AttendanceStatus) => {
  switch (status) {
    case "PRESENT":
      return {
        icon: CheckCircle,
        color: "text-green-700 bg-green-100",
        text: "Có mặt",
      };
    case "LATE":
      return {
        icon: Clock,
        color: "text-yellow-700 bg-yellow-100",
        text: "Đi trễ",
      };
    case "DONE":
      return {
        icon: CheckCircle,
        color: "text-blue-700 bg-blue-100",
        text: "Hoàn thành",
      };
    case "ABSENT":
      return {
        icon: XCircle,
        color: "text-red-700 bg-red-100",
        text: "Vắng mặt",
      };
    default:
      return {
        icon: AlertTriangle,
        color: "text-gray-700 bg-gray-100",
        text: "Không rõ",
      };
  }
};

const formatTime = (iso?: string | null) => {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* =======================
   COMPONENT
======================= */
export const AttendanceManagement: React.FC = () => {
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);

  /* Filters */
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<AttendanceStatus | "all">(
    "all"
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  /* Modals */
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<AttendanceRecord | null>(
    null
  );

  const [newAttendance, setNewAttendance] = useState({
    userId: "",
    date: new Date().toISOString().split("T")[0],
    checkInTime: "08:00",
    checkOutTime: "17:00",
  });

  /* =======================
     FETCH DATA
  ======================= */
  const fetchData = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem("user");
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const companyId = currentUser?.company?._id || currentUser?.company;

      if (!companyId) throw new Error("Không tìm thấy công ty");

      const [attendanceRes, usersRes] = await Promise.all([
        api.get("/attendance/attendance_all"),
        api.get(`/users/company/id/${companyId}`),
      ]);

      /* Attendance */
      const attendanceRaw =
        attendanceRes.data?.data || attendanceRes.data || [];
      const mappedAttendance: AttendanceRecord[] = attendanceRaw.map(
        (r: any) => {
          // CHUẨN HÓA NGÀY Ở ĐÂY ĐỂ FILTER CHẠY ĐÚNG
          const rawDate = r.date ? new Date(r.date) : new Date();
          const formattedDateForFilter = rawDate.toISOString().split("T")[0]; // "2025-12-23"

          return {
            id: r._id || r.id,
            // Backend trả về { employee: { name: ... } } nên r.employee.name là đúng
            employeeName: r.employee?.name || "Nhân viên",
            avatar:
              r.employee?.avatar || "https://ui-avatars.com/api/?name=User",
            date: formattedDateForFilter, // Lưu dạng YYYY-MM-DD
            checkInTime: formatTime(r.check_in_time),
            checkOutTime: formatTime(r.check_out_time),
            workHours: r.work_hours || 0,
            status: r.status,
          };
        }
      );
      console.log("mappedAttendance", mappedAttendance);

      setAttendanceRecords(mappedAttendance);

      /* Employees */
      const usersRaw = usersRes.data?.data || usersRes.data || [];
      const staffList: EmployeeOption[] = usersRaw
        .filter((u: any) => u.role?.toUpperCase() === "STAFF")
        .map((u: any) => ({
          id: u._id,
          fullName: u.fullName,
        }));
      setEmployees(staffList);
    } catch (err) {
      console.error("Fetch error:", err);
      alert("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* =======================
     CREATE ATTENDANCE
  ======================= */
  const handleCreateAttendance = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        user: newAttendance.userId,
        check_in_time: new Date(
          `${newAttendance.date}T${newAttendance.checkInTime}`
        ),
        check_out_time: new Date(
          `${newAttendance.date}T${newAttendance.checkOutTime}`
        ),
        status: "DONE",
        note: "Admin thêm thủ công",
      };

      await api.get("/attendance/attendance_all");
      alert("Thêm chấm công thành công");
      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Lỗi tạo chấm công");
    }
  };

  /* =======================
     FILTER
  ======================= */
  const filteredData = attendanceRecords.filter((r) => {
    const matchName = r.employeeName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchDate = !selectedDate || r.date === selectedDate;
    return matchName && matchStatus && matchDate;
  });

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="text-blue-600" /> Quản lý Chấm công
          </h2>
          <p className="text-sm text-gray-500">
            Dữ liệu được xác thực bằng Blockchain & AI
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={18} /> Thêm thủ công
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow mb-4 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="pl-10 w-full border rounded-lg px-3 py-2"
            placeholder="Tìm nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 border rounded-lg px-3">
          <Calendar size={16} />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as AttendanceStatus | "all")
          }
          className="border rounded-lg px-3"
        >
          <option value="all">Tất cả</option>
          <option value="DONE">Hoàn thành</option>
          <option value="PRESENT">Đi làm</option>
          <option value="LATE">Đi trễ</option>
          <option value="ABSENT">Vắng mặt</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Nhân viên</th>
              <th className="p-4 text-center">Ngày</th>
              <th className="p-4 text-center">Vào</th>
              <th className="p-4 text-center">Ra</th>
              <th className="p-4 text-center">Giờ</th>
              <th className="p-4 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center p-6">
                  Đang tải...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-6 text-gray-400">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              filteredData.map((r) => {
                const status = getStatusProps(r.status);
                return (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 flex items-center gap-3">
                      <img src={r.avatar} className="w-9 h-9 rounded-full" />
                      <span className="font-semibold">{r.employeeName}</span>
                    </td>
                    <td className="p-4 text-center">
                      {new Date(r.date).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-4 text-center">{r.checkInTime}</td>
                    <td className="p-4 text-center">{r.checkOutTime}</td>
                    <td className="p-4 text-center font-bold">
                      {r.workHours}h
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}
                      >
                        <status.icon size={12} className="inline mr-1" />
                        {status.text}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <form
            onSubmit={handleCreateAttendance}
            className="bg-white w-full max-w-md rounded-xl p-6 space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Thêm chấm công</h3>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X />
              </button>
            </div>

            <select
              required
              className="w-full border rounded-lg px-3 py-2"
              value={newAttendance.userId}
              onChange={(e) =>
                setNewAttendance({ ...newAttendance, userId: e.target.value })
              }
            >
              <option value="">-- Chọn nhân viên --</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.fullName}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2"
              value={newAttendance.date}
              onChange={(e) =>
                setNewAttendance({ ...newAttendance, date: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="time"
                value={newAttendance.checkInTime}
                onChange={(e) =>
                  setNewAttendance({
                    ...newAttendance,
                    checkInTime: e.target.value,
                  })
                }
              />
              <input
                type="time"
                value={newAttendance.checkOutTime}
                onChange={(e) =>
                  setNewAttendance({
                    ...newAttendance,
                    checkOutTime: e.target.value,
                  })
                }
              />
            </div>

            <button className="w-full bg-blue-600 text-white py-2 rounded-lg">
              Lưu
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
