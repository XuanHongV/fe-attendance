export const MyPayroll = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6"> Bảng lương cá nhân</h1>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Tháng</th>
              <th className="p-4 font-semibold text-gray-600">Tổng giờ làm</th>
              <th className="p-4 font-semibold text-gray-600">Thực lãnh</th>
              <th className="p-4 font-semibold text-gray-600">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-4">12/2025</td>
              <td className="p-4">160h</td>
              <td className="p-4 font-bold text-green-600">8.500.000 đ</td>
              <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Đã thanh toán</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};