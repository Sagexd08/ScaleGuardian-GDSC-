import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import apiClient from '@/shared/utilities/api'; // Assuming api.ts exports the configured client

// Define types for user and API responses (replace with your actual types)
interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('authToken') || null,
  status: 'idle',
  error: null,
};

// Example Async Thunk for Login
export const loginUser = createAsyncThunk<
  AuthResponse, // Return type of the payload creator
  { email: string; password: string }, // First argument to the payload creator (login credentials)
  { rejectValue: string } // Type for rejected value
>(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      // Replace with your actual API call using apiClient
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      localStorage.setItem('authToken', response.token); // Persist token
      return response; // This will be the action.payload on success
    } catch (error: any) {
      const errorMessage = error?.message || 'Login failed';
      localStorage.removeItem('authToken');
      return rejectWithValue(errorMessage); // This will be the action.payload on failure
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Standard reducer logic for logout
    logout: (state) => {
      localStorage.removeItem('authToken');
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
    },
    // You could add other synchronous actions here if needed
    // e.g., setUserFromToken: (state, action: PayloadAction<User>) => { ... }
  },
  extraReducers: (builder) => {
    builder
      // Login handling
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.user = null;
        state.token = null;
        state.error = action.payload ?? 'An unknown error occurred';
      });
      // Add cases for other async thunks (e.g., registerUser, fetchUserProfile)
  },
});

export const { logout } = authSlice.actions;

// Selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectIsAuthenticated = (state: RootState) => !!state.auth.token;

export default authSlice.reducer;