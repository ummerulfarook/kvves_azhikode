import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getDashboard } from '../../api/reports'

export const fetchDashboard = createAsyncThunk('reports/dashboard', async (_, { rejectWithValue }) => {
  try {
    const response = await getDashboard()
    return response.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load dashboard.')
  }
})

const reportsSlice = createSlice({
  name: 'reports',
  initialState: {
    dashboard: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => { state.loading = true })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false
        state.dashboard = action.payload
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const selectDashboard = (state) => state.reports.dashboard
export const selectDashboardLoading = (state) => state.reports.loading

export default reportsSlice.reducer
