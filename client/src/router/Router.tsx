import { Route, Routes} from 'react-router-dom';
import FirstLandingPage from '../components/FirstLandingPage';
import UploadPage from '../components/UpoladPage';
import { Dashboard } from '../components/Dashboard/Dashboard';
import Feedback from '../components/Dashboard/Feedback';
import VerifyPage from '../components/VerifyPage';


export default function Router () {
  return(
    <Routes>
      <Route path="/" element={<FirstLandingPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/verify" element={<VerifyPage />} />
       {/* any other route will be redirected to landing page */}
      <Route path="*" element={<FirstLandingPage />} />
      </Routes>
  )
}