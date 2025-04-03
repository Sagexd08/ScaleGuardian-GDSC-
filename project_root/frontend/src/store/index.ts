import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth.slice';
import governanceReducer from './slices/governance.slice';
import dashboardReducer from './slices/dashboard.slice';
// Import other reducers...

export const store = configureStore({
  reducer: {
    auth: authReducer,
    governance: governanceReducer,
    dashboard: dashboardReducer,
    // Add other reducers here
  },
  // Middleware is automatically added by configureStore (includes thunk)
  // DevTools Extension is also automatically enabled
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {auth: AuthState, governance: GovernanceState, ...}
export type AppDispatch = typeof store.dispatch;