import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as membersApi from '../../api/members'

export const fetchMembers = createAsyncThunk('members/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const response = await membersApi.getMembers(params)
    return response.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load members.')
  }
})

export const fetchMember = createAsyncThunk('members/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const response = await membersApi.getMember(id)
    return response.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Member not found.')
  }
})

export const fetchMemberSummary = createAsyncThunk('members/summary', async (id, { rejectWithValue }) => {
  try {
    const response = await membersApi.getMemberSummary(id)
    return response.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load summary.')
  }
})

const membersSlice = createSlice({
  name: 'members',
  initialState: {
    list: [],
    pagination: { count: 0, next: null, previous: null },
    currentMember: null,
    summary: null,
    loading: false,
    detailLoading: false,
    error: null,
  },
  reducers: {
    clearCurrentMember: (state) => {
      state.currentMember = null
      state.summary = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMembers.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.results || action.payload
        if (action.payload.count !== undefined) {
          state.pagination = {
            count: action.payload.count,
            next: action.payload.next,
            previous: action.payload.previous,
          }
        }
      })
      .addCase(fetchMembers.rejected, (state, action) => { state.loading = false; state.error = action.payload })

      .addCase(fetchMember.pending, (state) => { state.detailLoading = true; state.error = null })
      .addCase(fetchMember.fulfilled, (state, action) => {
        state.detailLoading = false
        state.currentMember = action.payload
      })
      .addCase(fetchMember.rejected, (state, action) => { state.detailLoading = false; state.error = action.payload })

      .addCase(fetchMemberSummary.fulfilled, (state, action) => { state.summary = action.payload })
  },
})

export const { clearCurrentMember, clearError } = membersSlice.actions

export const selectMembers = (state) => state.members.list
export const selectMembersPagination = (state) => state.members.pagination
export const selectCurrentMember = (state) => state.members.currentMember
export const selectMemberSummary = (state) => state.members.summary
export const selectMembersLoading = (state) => state.members.loading
export const selectMemberDetailLoading = (state) => state.members.detailLoading

export default membersSlice.reducer
