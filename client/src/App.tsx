import type { FC } from 'react'
import Router from './router/Router'
import './App.css'

const App: FC = () => {
  return (
    <main className="app-container">
      <Router />
    </main>
  )
}

export default App