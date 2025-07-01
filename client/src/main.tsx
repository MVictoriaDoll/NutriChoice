// src/main.tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react'

const domain   = import.meta.env.VITE_AUTH0_DOMAIN!
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID!
const audience = import.meta.env.VITE_AUTH0_AUDIENCE!

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>       {/* ← 只在这里包一次 */}
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience,
        }}
      >
        <App />
      </Auth0Provider>
    </BrowserRouter>
  </React.StrictMode>
)
