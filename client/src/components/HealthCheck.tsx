// This file is generated by AI tool to check connection
import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

export default function HealthCheck() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0()

  useEffect(() => {
    if (!isAuthenticated) return

    ;(async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: import.meta.env.VITE_AUTH0_AUDIENCE
          }
        })

        const res = await fetch('http://localhost:3000/api/health/ping', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error(`status ${res.status}`)

        const data = await res.json()
        console.log('✅ Health-check OK:', data)
      } catch (e) {
        console.error('❌ Health-check failed:', e)
      }
    })()
  }, [isAuthenticated, getAccessTokenSilently])

  return null
}
