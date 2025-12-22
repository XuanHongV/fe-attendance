
export const decodeToken = (token: string): any => {
  try {    const parts = token.split('.');
    
    if (parts.length !== 3) {
      throw new Error('Token không hợp lệ');
    }

    // Decode payload (phần thứ 2)
    const payload = parts[1];
    // Thêm padding nếu cần
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    
    // Decode base64url sang base64 rồi decode
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Lỗi decode token:', error);
    return null;
  }
};

/**
 * Lấy token từ localStorage và decode
 */
export const getDecodedToken = (): any => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  return decodeToken(token);
};

/**
 * Kiểm tra token còn hạn hay không
 */
export const isTokenExpired = (token?: string): boolean => {
  const targetToken = token || localStorage.getItem('accessToken');
  if (!targetToken) return true;

  const decoded = decodeToken(targetToken);
  if (!decoded || !decoded.exp) return true;

  // exp là Unix timestamp (giây), chuyển sang milliseconds
  const expirationTime = decoded.exp * 1000;
  return Date.now() > expirationTime;
};

/**
 * Lấy user ID từ token
 */
export const getUserIdFromToken = (token?: string): string | null => {
  const targetToken = token || localStorage.getItem('accessToken');
  if (!targetToken) return null;

  const decoded = decodeToken(targetToken);
  return decoded?.sub || decoded?._id || decoded?.userId || null;
};

/**
 * Lấy thông tin người dùng từ token
 */
export const getUserDataFromToken = (token?: string): any => {
  const targetToken = token || localStorage.getItem('accessToken');
  if (!targetToken) return null;

  return decodeToken(targetToken);
};