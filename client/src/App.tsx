import type { FC } from 'react'
import FirstLandingPage from './components/FirstLandingPage'
import UploadFile from './components/UpoladPage'


import './App.css'

const App: FC = () => {
  const handleFileUpload = (file: File) => {
    console.log('The file to be uploaded', file)

  }


  return (
    <>
      <div>
         <FirstLandingPage />
         <UploadFile onFileUpload={handleFileUpload}/>

      </div>


    </>
  )
}

export default App
