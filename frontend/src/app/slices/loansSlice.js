import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as loansApi from '../../api/loans'

export const fetchLoans = createAsyncThunk('loans/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await loansApi.getLoans(params)
    return response.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load loans.')
  }
})

const loansSlice = createSlice({
  name: 'loans',
  initialState: {
    list: [],
    pagination: { count: 0 },
    currentLoan: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLoans.pending, (state) => { state.loading = true })
      .addCase(fetchLoans.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.results || action.payload
        if (action.payload.count !== undefined) state.pagination.count = action.payload.count
      })
      .addCase(fetchLoans.rejected, (state, action) => { state.loading = false; state.error = action.payload })
  },
})

export const selectLoans = (state) => state.loans.list
export const selectLoansLoading = (state) => state.loans.loading
export const selectLoansPagination = (state) => state.loans.pagination

export default loansSlice.reducer
