import authReducer, { loginUser, logout } from '@/store/slices/auth.slice';
import type { AuthState } from '@/store/slices/auth.slice';

describe('Auth Slice Reducer', () => {
  const initialState: AuthState = {
    user: null,
    token: null,
    status: 'idle',
    error: null,
  };

  const loggedInState: AuthState = {
    user: { id: '1', name: 'Test User', email: 'test@example.com' },
    token: 'fake-token',
    status: 'succeeded',
    error: null,
  };

  beforeEach(() => {
    // Clear local storage before each test
    localStorage.clear();
  });

  test('should return the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  test('should handle logout action', () => {
    // Start from a logged-in state
    localStorage.setItem('authToken', 'fake-token'); // Simulate logged-in state
    
    expect(authReducer(loggedInState, logout())).toEqual({
      ...initialState, // Logout should reset to initial state
      token: null // explicitly ensure token is null
    });
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  // Testing async thunks
  describe('loginUser async thunk', () => {
    const mockUser = { id: '1', name: 'Test User', email: 'test@example.com' };
    const mockAuthResponse = { user: mockUser, token: 'new-fake-token' };

    test('should set status to loading when loginUser is pending', () => {
      const action = { type: loginUser.pending.type };
      const state = authReducer(initialState, action);
      expect(state.status).toBe('loading');
      expect(state.error).toBeNull();
    });

    test('should update user and token when loginUser is fulfilled', () => {
      const action = { type: loginUser.fulfilled.type, payload: mockAuthResponse };
      const state = authReducer({ ...initialState, status: 'loading' }, action);
      expect(state.status).toBe('succeeded');
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('new-fake-token');
      expect(localStorage.getItem('authToken')).toBe('new-fake-token');
    });

    test('should set error and clear user/token when loginUser is rejected', () => {
      const errorPayload = 'Invalid credentials';
      const action = { type: loginUser.rejected.type, payload: errorPayload };
      const loggedInState: AuthState = { ...initialState, token: 'old-token', status: 'loading' };
      localStorage.setItem('authToken', 'old-token'); // Simulate previous token

      const state = authReducer(loggedInState, action);
      expect(state.status).toBe('failed');
      expect(state.user).toBeNull();
      expect(state.token).toBeNull(); // Ensure token is cleared on failure
      expect(state.error).toBe(errorPayload);
      expect(localStorage.getItem('authToken')).toBeNull(); // Ensure token removed from storage
    });

    test('should handle rejected without payload', () => {
      const action = { type: loginUser.rejected.type, error: { message: 'Network Error' }}; // No explicit payload
      const state = authReducer(initialState, action);
      expect(state.status).toBe('failed');
      expect(state.error).toBe('An unknown error occurred'); // Default error message
    });
  });
});
