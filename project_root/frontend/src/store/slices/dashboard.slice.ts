import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import apiClient from '@/shared/utilities/api';
import type { DashboardStats, ChartData } from '@/shared/types'; // Assuming types are defined globally

interface DashboardState {
  stats: DashboardStats | null;
  chartData: ChartData | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  chartData: null,
  status: 'idle',
  error: null,
};

// Async Thunk for fetching dashboard data
export const fetchDashboardData = createAsyncThunk<
  { stats: DashboardStats; chartData: ChartData }, // Return type
  void, // Argument type
  { rejectValue: string }
>(
  'dashboard/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      // Adjust endpoint - might need multiple calls or a single aggregate endpoint
      const response = await apiClient.get<{ stats: DashboardStats; chartData: ChartData }>('/dashboard/all');
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || 'Failed to fetch dashboard data');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action: PayloadAction<{ stats: DashboardStats; chartData: ChartData }>) => {
        state.status = 'succeeded';
        state.stats = action.payload.stats;
        state.chartData = action.payload.chartData;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

// Selectors
export const selectDashboardStats = (state: RootState) => state.dashboard.stats;
export const selectDashboardChartData = (state: RootState) => state.dashboard.chartData;
export const selectDashboardStatus = (state: RootState) => state.dashboard.status;
export const selectDashboardError = (state: RootState) => state.dashboard.error;

export default dashboardSlice.reducer;