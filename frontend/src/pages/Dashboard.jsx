import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import StatsCard from "../components/StatsCard";
import MediaCard from "../components/MediaCard";
import PlatformChart from "../components/PlatformChart";

import "./Dashboard.css";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

const Dashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [platformData, setPlatformData] = useState([]);

  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [ordering, setOrdering] = useState("-created_at");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [status, type, ordering]);

  const fetchDashboard = async () => {
    setLoading(true);

    try {
      const statsRes = await api.get("/stats/");
      setStats(statsRes.data);

      setPlatformData(
        (statsRes.data.by_platform || []).filter(p => p.platform)
      );

      const mediaRes = await api.get("/media/", {
        params: {
          status: status || undefined,
          media_type: type || undefined,
          ordering,
        },
      });

      setMediaList(mediaRes.data || []);
    } catch (err) {
      setMediaList([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="loading">Loading dashboard...</p>;
  }

  return (
    <div className="dashboard">
      {/*header*/}
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Track and manage your movies and TV shows</p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/add-media")}>
          + Add Media
        </button>
      </div>

      {/*stats*/}
      <div className="stats-grid">
        <StatsCard title="Total Media" value={stats?.total_media || 0} />
        <StatsCard title="Movies" value={stats?.total_movies || 0} />
        <StatsCard title="TV Shows" value={stats?.total_tv_shows || 0} />
        <StatsCard title="Watching" value={stats?.watching || 0} />
        <StatsCard title="Completed" value={stats?.completed || 0} />
        <StatsCard title="Watchlist" value={stats?.watchlist || 0} />
      </div>

      {/*media overview*/}
      <div className="dashboard-content">
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Media Overview</h2>

            <div className="filters">
              <select value={type} onChange={e => setType(e.target.value)}>
                <option value="">All Types</option>
                <option value="movie">Movies</option>
                <option value="tv_show">TV Shows</option>
              </select>

              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="watching">Watching</option>
                <option value="completed">Completed</option>
                <option value="watchlist">Watchlist</option>
              </select>

              <select value={ordering} onChange={e => setOrdering(e.target.value)}>
                <option value="-created_at">Newest First</option>
                <option value="created_at">Oldest First</option>
                <option value="title">Title A-Z</option>
                <option value="-title">Title Z-A</option>
                <option value="-rating">Highest Rated</option>
                <option value="rating">Lowest Rated</option>
              </select>
            </div>
          </div>

          {mediaList.length === 0 ? (
            <p className="empty-text">No media found</p>
          ) : (
            <div className="media-grid">
              {mediaList.slice(0, 8).map(media => (
                <MediaCard
                  key={media.id}
                  media={media}
                  onClick={() => navigate(`/media/${media.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        {/*platform chart*/}
        <section className="dashboard-section">
          <h2>Platform Distribution</h2>
          <PlatformChart data={platformData} />
        </section>
      </div>
    </div>
  );
};

export default Dashboard;