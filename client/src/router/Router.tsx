import { Route, Routes} from 'react-router-dom';
import FirstLandingPage from '../components/FirstLandingPage';
import UploadFile from '../components/UpoladPage';
import { Dashboard } from '../components/Dashboard/Dashboard';


export default function Router () {
  return(
    <Routes>
      <Route path="/" element={<FirstLandingPage />} />
      <Route path="/upload" element={<UploadFile onFileUpload={(file) => console.log('Received file:', file)} />}/>
      <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
  )
}