import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import heroImg from '../assets//Animation - 1750629413888.gif'
import './FirstLandingPage.css'

const FirstLandingPage: FC = () => {
  const navigate = useNavigate()
  const { loginWithRedirect, logout, isAuthenticated, isLoading } = useAuth0() // can add user here later if we need to display user profile

   const handleUpload = () => {
    navigate('/upload')
  }

  if (isLoading) {
    return <p className="FirstLandingLoading">Loading...</p>
  }

  return (
    <div className="FirstLandingPageContainer">
      <img src={heroImg} alt="Hero" className="heroImg" />
      <h1 className="FirstLandingTitle">Welcome to NutriSwap</h1>
      <p className="FirstLandingSubtitle">
        Helping you shop smarter and eat better — one grocery trip at a time.
      </p>

      {isAuthenticated ? (
        <>
          <button
            className="FirstLandingButton"
            onClick={handleUpload}
          >
            Scan your bill now
          </button>
          <button
            className="FirstLandingLogout"
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
          >
            Logout
          </button>
        </>
      ) : (
        <div className="AuthCard">
          {/* login with email + password */}
          <button
            className="FirstLandingButton"
            onClick={() =>
              loginWithRedirect({
                authorizationParams: { screen_hint: 'login' }
              })
            }
          >
            Sign in with Email
          </button>

          {/* sign up with email + password */}
          <button
            className="FirstLandingButton"
            onClick={() =>
              loginWithRedirect({
                authorizationParams: { screen_hint: 'signup' }
              })
            }
          >
            Register with Email
          </button>

          {/* Sign in with Google account */}
          <button
            className="FirstLandingButton google"
            onClick={() =>
              loginWithRedirect({
                authorizationParams: { connection: 'google-oauth2' }
              })
            }
          >
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  )
}

export default FirstLandingPage