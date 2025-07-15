// src/App.tsx
import React from 'react'
import Router from './router/Router'
import HealthCheck from './components/HealthCheck'
import './App.css'

export default function App() {
  return (
    <>
      <HealthCheck />
      <Router />
    </>
  )
}
