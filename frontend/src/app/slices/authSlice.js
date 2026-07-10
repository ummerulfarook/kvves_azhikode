import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { login as loginApi, logout as logoutApi, getProfile } from '../../api/auth'

const storedUser = localStorage.getItem('user')
const storedTheme = localStorage.getItem('theme') || 'light'

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  loading: false,
  error: null,
  theme: storedTheme,
}

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await loginApi(credentials)
    return response.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed. Please check your credentials.')
  }
})

export const logoutUser = createAsyncThunk('auth/logout', async (_, { getState }) => {
  const { refreshToken } = getState().auth
  try {
    await logoutApi(refreshToken)
  } catch (_) {}
})

export const fetchProfile = createAsyncThunk('auth/profile', async (_, { rejectWithValue }) => {
  try {
    const response = await getProfile()
    return response.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load profile.')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setTokens: (state, action) => {
      state.accessToken = action.payload.access
      state.refreshToken = action.payload.refresh
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', state.theme)
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.accessToken = action.payload.access
        state.refreshToken = action.payload.refresh
        state.user = action.payload.user

        localStorage.setItem('access_token', action.payload.access)
        localStorage.setItem('refresh_token', action.payload.refresh)
        localStorage.setItem('user', JSON.stringify(action.payload.user))
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
        state.refreshToken = null
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
      })

      // Profile
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload }
        localStorage.setItem('user', JSON.stringify(state.user))
      })
  },
})

export const { clearError, setTokens, toggleTheme } = authSlice.actions

export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => !!state.auth.user && !!state.auth.accessToken
export const selectUserRole = (state) => state.auth.user?.role
export const selectAuthLoading = (state) => state.auth.loading
export const selectAuthError = (state) => state.auth.error
export const selectTheme = (state) => state.auth.theme || 'light'

export default authSlice.reducer
