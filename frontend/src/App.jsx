import {Routes, Route} from 'react-router-dom'
import Sidebar from "./components/Sidebar"
import "./App.css"

function App(){
  return(
    <div className='app-layout'>
      <Sidebar/>
    </div>
  )
}

export default App
