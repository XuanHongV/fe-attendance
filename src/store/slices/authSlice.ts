import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/apiService';
import { decodeAccessToken } from '../../utils/jwtHelper';

interface User {
  _id: string;
  fullName: string;   
  email: string;
  role: string;      
  company?: string;   
  companyCode?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
}

const getUserFromStorage = (): User | null => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Lỗi parse user từ LocalStorage", error);
    localStorage.removeItem('user'); 
    return null;
  }
};

const getTokenFromStorage = (): string | null => {
  return localStorage.getItem('accessToken');
};

const initialState: AuthState = {
  user: getUserFromStorage(),    
  accessToken: getTokenFromStorage(),
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

export const registerAdmin = createAsyncThunk(
  'auth/registerAdmin',
  async (userData: any, thunkAPI) => {
    try {
      const response = await api.post('/auths/registerAdmin', userData);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Đăng ký thất bại';
      return thunkAPI.rejectWithValue(Array.isArray(message) ? message[0] : message);
    }
  }
);

export const registerEmployee = createAsyncThunk(
  'auth/registerEmployee',
  async (userData: any, thunkAPI) => {
    try {
      const response = await api.post('/auths/registerEmployee', userData);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Đăng ký thất bại';
      return thunkAPI.rejectWithValue(Array.isArray(message) ? message[0] : message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (userData: any, thunkAPI) => {
    try {
      const response = await api.post('/auths/signIn', userData);
      
      const token = response.data.access_token || response.data.accessToken;
      const user = response.data.user;

      console.log("Đăng nhập thành công, user:", user);

      if (token && user) {
        localStorage.setItem('accessToken', token);
        decodeAccessToken(token)
        localStorage.setItem('user', JSON.stringify(user));
      }

      return { user, access_token: token }; 
    } catch (error: any) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại';
      return thunkAPI.rejectWithValue(Array.isArray(message) ? message[0] : message);
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    logoutUser: (state) => {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      state.user = null;
      state.accessToken = null;
      state.isSuccess = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerAdmin.pending, (state) => { state.isLoading = true; })
      .addCase(registerAdmin.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Đăng ký Doanh nghiệp thành công! Vui lòng đăng nhập.";
      })
      .addCase(registerAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })

      .addCase(registerEmployee.pending, (state) => { state.isLoading = true; })
      .addCase(registerEmployee.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Đăng ký Nhân viên thành công! Vui lòng chờ duyệt.";
      })
      .addCase(registerEmployee.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
      })

      .addCase(loginUser.pending, (state) => { 
        state.isLoading = true; 
        state.isError = false; 
        state.isSuccess = false;
        state.message = ''; 
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.isError = false;
        state.message = '';
        state.user = action.payload.user;
        state.accessToken = action.payload.access_token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload as string;
        state.user = null;
        state.accessToken = null;
      });
  },
});

export const { reset, logoutUser } = authSlice.actions;
export default authSlice.reducer;