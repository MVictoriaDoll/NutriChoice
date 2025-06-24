import type { FC } from 'react'
import { useState } from 'react'
import FirstLandingPage from './components/FirstLandingPage'
import { Dashboard } from './components/Dashboard/Dashboard'
import UploadFile from './components/UpoladPage'

import './App.css'

// mock verification page here, need to be replaced later
const VerifyPage: FC<{ onConfirm: () => void }> = ({ onConfirm }) => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>🔍 Verify the grocery items</h2>
    <p>This is a placeholder for your Verify Page.</p>
    <button onClick={onConfirm}>Confirm and Continue</button>
  </div>
)

const App: React.FC = () => {
  //const [showDashboard] = useState<boolean>(false)
  // handle switching states
  const [stage, setStage] = useState<'landing' | 'upload' | 'verify' | 'dashboard'>('landing')


  // go from FirstLandingPage to UploadPage
  const handleStart = () => {
    setStage('upload')
  }

  // from UploadPage to VerifyPage
  const handleFileUpload = (file: File) => {
    console.log('The file you selected to upload', file)
    // TODO: AI identification processing here or later in VerifyPage?
    setStage('verify')
  }


  // VerifyPage to dashboard
  const handleVerifyConfirm = () => {
    setStage('dashboard')
  }


  return (
    <main>
      {stage === 'landing' && <FirstLandingPage onStart={handleStart} />}
      {stage === 'upload' && <UploadFile onFileUpload={handleFileUpload} />}
      {stage === 'verify' && <VerifyPage onConfirm={handleVerifyConfirm} />}
      {stage === 'dashboard' && <Dashboard />}
    </main>
  )
}

export default App
