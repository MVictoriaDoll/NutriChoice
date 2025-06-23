// src/App.tsx

import { useState } from 'react'
import FirstLandingPage from './components/FirstLandingPage'
import { Dashboard } from './components/Dashboard/Dashboard'

import './App.css'

const App: React.FC = () => {
  const [showDashboard] = useState<boolean>(false)

  return (
    <main>
      {showDashboard ? (
        <Dashboard />
      ) : (
        <FirstLandingPage />
      )}
    </main>
  )
}

export default App
