import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthStatus,
  selectAuthError,
  loginUser, // Import async thunk
  logout,     // Import reducer action
} from '@/store/slices/auth.slice';

export const useAuth = () => {
  const dispatch = useAppDispatch();

  // Selectors
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);

  // Actions - wrap dispatch around actions/thunks
  const attemptLogin = (credentials: { email: string; password: string }) => {
    return dispatch(loginUser(credentials)); // Return the promise for handling in component
  };

  const performLogout = () => {
    dispatch(logout());
  };

  return {
    user,
    isAuthenticated,
    status,
    error,
    login: attemptLogin,
    logout: performLogout,
  };
};