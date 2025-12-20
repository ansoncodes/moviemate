import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import AddMedia from "./pages/AddMedia";
import Movies from "./pages/Movies"
import TVShows from "./pages/TVShows";
import Stats from "./pages/Stats";
import MediaDetail from "./pages/MediaDetail";
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
          <Route path="/movies" element={<Movies />} />
          <Route path="/tvshows" element={<TVShows />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/media/:id" element={<MediaDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
