import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/shared/components/Layout';
import LoadingSpinner from '@/shared/components/ui/LoadingSpinner'; // Example loading component
import { useAuth } from '@/shared/hooks/useAuth'; // Adjust this import based on your auth setup

// Lazy load feature components
const Home = React.lazy(() => import('@/features/home/Home'));
const Dashboard = React.lazy(() => import('@/features/dashboard/Dashboard'));
const Governance = React.lazy(() => import('@/features/governance/Governance'));
// const ProposalDetail = React.lazy(() => import('@/features/governance/pages/ProposalDetail')); // Example nested route

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth(); // Adjust according to your auth implementation

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Suspense fallback={<Layout><LoadingSpinner /></Layout>}> {/* Provide fallback UI during load */}
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Layout><Home /></Layout>} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/governance"
          element={
            <ProtectedRoute>
              <Layout><Governance /></Layout>
            </ProtectedRoute>
          }
        />
         {/* Example Nested Protected Route */}
         {/* <Route
           path="/governance/proposals/:proposalId"
           element={
             <ProtectedRoute>
               <Layout><ProposalDetail /></Layout>
             </ProtectedRoute>
           }
         /> */}

        {/* Add Login/Signup routes */}
        {/* <Route path="/login" element={<LoginPage />} /> */}

        {/* Catch-all Not Found Route */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </Suspense>
  );
};