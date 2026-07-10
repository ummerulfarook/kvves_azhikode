import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as chitsApi from '../../api/chits'

export const fetchChitGroups = createAsyncThunk('chits/fetchGroups', async (params, { rejectWithValue }) => {
  try {
    const response = await chitsApi.getChitGroups(params)
    return response.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load chit groups.')
  }
})

export const fetchChitGroup = createAsyncThunk('chits/fetchGroup', async (id, { rejectWithValue }) => {
  try {
    const response = await chitsApi.getChitGroup(id)
    return response.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Chit group not found.')
  }
})

const chitsSlice = createSlice({
  name: 'chits',
  initialState: {
    groups: [],
    currentGroup: null,
    pagination: { count: 0 },
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentGroup: (state) => { state.currentGroup = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChitGroups.pending, (state) => { state.loading = true })
      .addCase(fetchChitGroups.fulfilled, (state, action) => {
        state.loading = false
        state.groups = action.payload.results || action.payload
        if (action.payload.count !== undefined) state.pagination.count = action.payload.count
      })
      .addCase(fetchChitGroups.rejected, (state, action) => { state.loading = false; state.error = action.payload })
      .addCase(fetchChitGroup.fulfilled, (state, action) => { state.currentGroup = action.payload })
  },
})

export const { clearCurrentGroup } = chitsSlice.actions
export const selectChitGroups = (state) => state.chits.groups
export const selectCurrentChitGroup = (state) => state.chits.currentGroup
export const selectChitsLoading = (state) => state.chits.loading

export default chitsSlice.reducer
