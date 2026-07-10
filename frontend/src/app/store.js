import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import membersReducer from './slices/membersSlice'
import chitsReducer from './slices/chitsSlice'
import loansReducer from './slices/loansSlice'
import duesReducer from './slices/duesSlice'
import reportsReducer from './slices/reportsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    members: membersReducer,
    chits: chitsReducer,
    loans: loansReducer,
    dues: duesReducer,
    reports: reportsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export default store
