import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useGetMeQuery } from '../store/api/authApi';
import { setCredentials, logout } from '../store/features/auth/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated } = useSelector(state => state.auth);
  const { data, error, isLoading } = useGetMeQuery(undefined, {
    skip: !token
  });

  useEffect(() => {
    if (data) {
      dispatch(setCredentials({ user: data, token }));
    } else if (error) {
      dispatch(logout());
    }
  }, [data, error, dispatch, token]);

  return { 
    user,
    isAuthenticated,
    isLoading
  };
};
