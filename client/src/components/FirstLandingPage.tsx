import type { FC } from 'react'
import './FirstLandingPage.css'
import heroImg from '../assets/Animation - 1750629413888.gif'

const FirstLandingPage: FC = () => {
  return (
    <div className='FirstLandingPageContainer'>
      <img src={heroImg} alt="Hero Image of the first landing page" className='heroImg' />
      <h1 className="FirstLandingTitle">Welcome to NutriSwap</h1>

      <p className="FirstLandingSubtitle">Helping you shop smarter and eat better — one grocery trip at a time.</p>

      <button className="FirstLandingButton">Scan your groceries</button>
    </div>
  )
}

export default FirstLandingPage