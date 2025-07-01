import { Routes, Route, Navigate } from 'react-router-dom'
import FirstLandingPage from '../components/FirstLandingPage';
import UploadPage from '../components/UpoladPage';
import { Dashboard } from '../components/Dashboard/Dashboard';
import Feedback from '../components/Dashboard/Feedback';
import VerifyPage from '../components/VerifyPage';
import { useAuth0 } from '@auth0/auth0-react'

function ProtectedRoute({ children }: { children: React.JSX.Element }) {
  const { isLoading, isAuthenticated } = useAuth0()
  if (isLoading) return <p>Loading now......</p>
  return isAuthenticated ? children : <Navigate to="/" replace />
}


export default function Router () {
  return(
    <Routes>
      <Route path="/" element={<FirstLandingPage />} />
      <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
      <Route path="/verify/:receiptId" element={<ProtectedRoute><VerifyPage /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/feedback" element={<ProtectedRoute><Feedback /></ProtectedRoute>}/>
       {/* any other route will be redirected to landing page */}
      <Route path="*" element={<FirstLandingPage />} />
      </Routes>
  )
}