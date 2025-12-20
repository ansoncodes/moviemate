import { NavLink } from "react-router-dom";
import { BiSolidMoviePlay } from "react-icons/bi";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="logo">
        <BiSolidMoviePlay />
        <span>MovieMate</span>
      </div>

      <nav className="nav-links">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/movies">Movies</NavLink>
        <NavLink to="/tvshows">TV Shows</NavLink>
        <NavLink to="/add-media">Add Media</NavLink>
        <NavLink to="/stats">Stats</NavLink>
      </nav>
      
    </aside>
  );
};

export default Sidebar;
