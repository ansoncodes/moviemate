import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import AddMedia from "./pages/AddMedia";
import Movies from "./pages/Movies"
import TVShows from "./pages/TVShows";
import "./App.css";

function App() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-media" element={<AddMedia />} />
          <Route path="/movies" element={<Movies/>} />
          <Route path="/tvshows" element={<TVShows/>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
