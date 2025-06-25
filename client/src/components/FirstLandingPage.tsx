import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import heroImg from '../assets//Animation - 1750629413888.gif'
import './FirstLandingPage.css'

const FirstLandingPage: FC = () => {
  const navigate = useNavigate()

  return (
    <div className="FirstLandingPageContainer">
      <img src={heroImg} alt="Hero" className="heroImg" />
      <h1 className="FirstLandingTitle">Welcome to NutriSwap</h1>
      <p className="FirstLandingSubtitle">
        Helping you shop smarter and eat better — one grocery trip at a time.
      </p>
      <button
        className="FirstLandingButton"
        onClick={() => navigate('/upload')}
      >
        Scan your bill now
      </button>
    </div>
  )
}

export default FirstLandingPage
