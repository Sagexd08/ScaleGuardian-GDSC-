import React, { useState, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser, selectAuthStatus, selectAuthError } from '@/store/slices/auth.slice';
import { Button } from "@/shared/components/ui/button"; // Using shadcn Button
import { Input } from "@/shared/components/ui/input";   // Using shadcn Input
import { Label } from "@/shared/components/ui/label";   // Using shadcn Label
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card"; // Using shadcn Card

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const authStatus = useAppSelector(selectAuthStatus);
  const authError = useAppSelector(selectAuthError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Get the 'from' location if redirected by ProtectedRoute
  const from = location.state?.from?.pathname || "/dashboard"; // Default redirect after login

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (authStatus !== 'loading') {
      try {
        await dispatch(loginUser({ email, password })).unwrap();
        // unwrap() throws an error if the thunk is rejected
        navigate(from, { replace: true }); // Navigate to original destination or dashboard
      } catch (err) {
        // Error is handled by the slice and displayed via selectAuthError
        console.error('Failed to login:', err);
        // You might show a toast notification here as well
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={authStatus === 'loading'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={authStatus === 'loading'}
              />
            </div>
            {authError && (
              <p className="text-sm text-red-600">{authError}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={authStatus === 'loading'}>
              {authStatus === 'loading' ? 'Logging in...' : 'Login'}
            </Button>
          </CardFooter>
        </form>
         {/* Optional: Add link to Sign Up page */}
         {/* <p className="mt-4 text-center text-sm">
           Don't have an account?{' '}
           <Link to="/signup" className="underline">
             Sign up
           </Link>
         </p> */}
      </Card>
    </div>
  );
};

export default LoginPage;