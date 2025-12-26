import React, { useState, useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner"; // Import thư viện quét mới
import { useSelector } from "react-redux";
import { RootState } from "../../store/store";
import api from "../../services/apiService";
import {
  Clock,
  MapPin,
  Calendar,
  CheckCircle,
  AlertTriangle,
  QrCode,
  ArrowLeft,
} from "lucide-react";

export const Timekeeping = () => {
  const [isScanning, setIsScanning] = useState(false); // Trạng thái mở camera quét
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [todayShifts, setTodayShifts] = useState<any[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(true);
  const { user } = useSelector((state: RootState) => state.auth);

  // 1. Lấy danh sách ca làm việc để nhân viên biết hôm nay mình làm ca nào
  useEffect(() => {
    const fetchTodayShifts = async () => {
      if (!user?._id) return;
      try {
        setIsLoadingShifts(true);
        const response = await api.get(`/shift-assignments/user/${user._id}`);
        const allShifts = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        const todayStr = new Date().toISOString().split("T")[0];
        const shiftsToday = allShifts.filter((item: any) =>
          item.work_date.startsWith(todayStr)
        );
        setTodayShifts(shiftsToday);
      } catch (error) {
        console.error("Lỗi tải ca làm việc:", error);
      } finally {
        setIsLoadingShifts(false);
      }
    };
    fetchTodayShifts();
  }, [user]);


const getLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    });
};

  // 2. Hàm xử lý khi quét được mã QR thành công
  const handleScan = async (text: string) => {
    if (!text || loading) return;

    setLoading(true);
    setIsScanning(false); // Đóng camera sau khi quét trúng

    // 1. Lấy vị trí từ Sensors/GPS thực tế
  const getCoordinates = (): Promise<{lat: number, lng: number}> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({ lat: 0, lng: 0 }), // Trả về 0 nếu người dùng từ chối
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  const coords = await getCoordinates();

    try {
      // Gửi token quét được lên API verify-qr mà bạn đã viết ở backend
      const response = await api.post("/attendance/verify-qr", { token: text, aiMetadata: {
        location: coords }});

      const result = response.data;
      setMessage({
        type: "success",
        text: result.message || "Điểm danh thành công!",
      });

      // Phát âm thanh báo hiệu
      new Audio("https://www.soundjay.com/button/beep-07.wav")
        .play()
        .catch(() => {});
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message || "Mã QR không hợp lệ hoặc đã hết hạn",
      });
      new Audio("https://www.soundjay.com/button/button-10.wav")
        .play()
        .catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const currentDateDisplay = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());

  // Giao diện Camera quét QR
  if (isScanning) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4">
        <button
          onClick={() => setIsScanning(false)}
          className="absolute top-6 left-6 text-white flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg"
        >
          <ArrowLeft size={20} /> Quay lại
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
            Quét mã QR điểm danh
          </h2>
          <p className="text-blue-400 mt-2">
            Vui lòng đưa mã QR vào khung hình
          </p>
        </div>

        <div className="w-full max-w-md aspect-square overflow-hidden rounded-3xl border-4 border-blue-500 relative">
          <Scanner
            onScan={(result) => {
              if (result && result.length > 0) {
                handleScan(result[0].rawValue);
              }
            }}
            allowMultiple={false}
            scanDelay={2000}
          />
          {/* Khung giả lập quét */}
          <div className="absolute inset-10 border-2 border-white/30 rounded-xl pointer-events-none border-dashed animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <QrCode className="text-blue-600" size={36} />
            Hệ thống Điểm danh
          </h1>
          <p className="text-gray-500 mt-1">{currentDateDisplay}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cột trái: Nút bấm chính */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
              <QrCode size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Sẵn sàng chấm công?
            </h3>
            <p className="text-gray-500 mb-8 max-w-xs">
              Sử dụng camera để quét mã QR được cung cấp bởi quản lý tại quầy
              hoặc trên máy tính.
            </p>

            <button
              onClick={() => setIsScanning(true)}
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-3"
            >
              {loading ? "Đang xử lý..." : "BẮT ĐẦU QUÉT MÃ QR"}
            </button>

            {message && (
              <div
                className={`mt-6 w-full p-4 rounded-xl border flex items-center gap-3 ${
                  message.type === "success"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle />
                ) : (
                  <AlertTriangle />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Thông tin ca làm việc */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-blue-500" /> Ca làm việc hôm nay
            </h4>

            {isLoadingShifts ? (
              <p className="text-gray-400 text-sm italic">Đang tải...</p>
            ) : todayShifts.length === 0 ? (
              <p className="text-gray-500 text-sm">Hôm nay bạn không có ca.</p>
            ) : (
              <div className="space-y-3">
                {todayShifts.map((item) => (
                  <div
                    key={item._id}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <p className="font-bold text-gray-800">{item.shift.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <Clock size={12} /> {item.shift.start_time} -{" "}
                      {item.shift.end_time}
                    </p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
