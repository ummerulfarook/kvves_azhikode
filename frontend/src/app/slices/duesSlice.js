import { createSlice } from '@reduxjs/toolkit'

const duesSlice = createSlice({
  name: 'dues',
  initialState: {
    dues: [],
    deposits: [],
    loading: false,
    error: null,
  },
  reducers: {
    setDues: (state, action) => { state.dues = action.payload },
    setDeposits: (state, action) => { state.deposits = action.payload },
    setLoading: (state, action) => { state.loading = action.payload },
  },
})

export const { setDues, setDeposits, setLoading } = duesSlice.actions
export const selectDues = (state) => state.dues.dues
export const selectDeposits = (state) => state.dues.deposits
export const selectDuesLoading = (state) => state.dues.loading

export default duesSlice.reducer
