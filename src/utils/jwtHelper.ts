export interface JwtPayload {
    [key: string]: any;
    exp?: number;
    iat?: number;
    sub?: string;
}

function base64UrlDecode(str: string): string {
    // Replace base64url specific chars
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with '='
    const pad = str.length % 4;
    if (pad) str += '='.repeat(4 - pad);

    // Browser environment
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
        try {
            // atob returns binary string; decodeURIComponent handles UTF-8
            return decodeURIComponent(
                Array.prototype.map
                    .call(window.atob(str), (c: string) => {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    })
                    .join('')
            );
        } catch (err) {
            // Fallback to atob raw if decodeURIComponent fails
            return window.atob(str);
        }
    }

    // Node environment
    return Buffer.from(str, 'base64').toString('utf8');
}

/**
 * Decode a JWT access token payload without verifying signature.
 * Returns the parsed payload or null if it cannot be decoded.
 */
export function decodeAccessToken(token: string): JwtPayload | null {
    if (!token) return null;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = base64UrlDecode(parts[1]);
        return JSON.parse(payload);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to decode access token', err);
        return null;
    }
}

/**
 * Return true if token is expired (based on `exp` claim). If no `exp`, returns false.
 */
export function isTokenExpired(token: string): boolean {
    const payload = decodeAccessToken(token);
    if (!payload) return true;
    if (!payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
}

/**
 * Try to extract a `user` object from token payload. Returns null if nothing found.
 */
export function getUserFromToken(token: string): any | null {
    const payload = decodeAccessToken(token);
    if (!payload) return null;
    if (payload.user) return payload.user;

    // Common fallback fields
    const { sub, email, name, fullName, role, company, companyCode } = payload;
    if (sub || email || name || fullName) {
        return {
            _id: sub,
            email,
            fullName: fullName || name,
            role,
            company,
            companyCode,
        };
    }

    return null;
}
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Lỗi khi parse user từ localStorage:', error);
    return null;
  }
};