import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaFilm, FaTv, FaStar, FaClock, FaCheck, FaList } from "react-icons/fa";
import StatsCard from "../components/StatsCard";
import "./Stats.css";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

const Stats = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
  setLoading(true);
  try {
    const [statsRes, mediaRes] = await Promise.all([
      api.get("/stats/"),
      api.get("/media/"),
    ]);

    setStats(statsRes.data);
    setMediaList(mediaRes.data || []);
  } finally {
    setLoading(false);
  }
};


  if (loading) {
    return <p className="loading">Loading statistics...</p>;
  }

  //calculate genre distribution
  const genreDistribution = {};
  mediaList.forEach((media) => {
    media.genres?.forEach((genre) => {
      genreDistribution[genre.name] = (genreDistribution[genre.name] || 0) + 1;
    });
  });

  const genreData = Object.entries(genreDistribution)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  //calculate status distribution
  const statusData = [
    { name: "Watching", count: stats?.watching || 0, color: "#3b82f6" },
    { name: "Completed", count: stats?.completed || 0, color: "#10b981" },
    { name: "Watchlist", count: stats?.watchlist || 0, color: "#f59e0b" },
  ].filter((item) => item.count > 0);

  //platform distribution
  const platformData = (stats?.by_platform || [])
    .filter((p) => p.platform)
    .slice(0, 8);

  //top rated
  const topRated = (stats?.top_rated || []).slice(0, 5);

  //recently completed
  const recentlyCompleted = mediaList
    .filter((m) => m.status === "completed")
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .slice(0, 5);

  //movies vs tv comparison
  const totalMedia = stats?.total_media || 0;
  const moviesPercentage = totalMedia > 0 
    ? Math.round((stats?.total_movies / totalMedia) * 100) 
    : 0;
  const tvShowsPercentage = 100 - moviesPercentage;

  // watchlist vs completed ratio
  const watchlistCount = stats?.watchlist || 0;
  const completedCount = stats?.completed || 0;
  const totalTracked = watchlistCount + completedCount;
  const watchlistPercentage = totalTracked > 0 
    ? Math.round((watchlistCount / totalTracked) * 100) 
    : 0;
  const completedPercentage = 100 - watchlistPercentage;

  return (
    <div className="stats-page">
      <div className="stats-header">
        <div>
          <h1>Statistics</h1>
          <p>Your viewing habits and analytics</p>
        </div>
      </div>

      {/*overview cards*/}
      <div className="overview-section">
        <h2>Overview</h2>
        <div className="stats-grid">
          <StatsCard
            title="Total Media"
            value={stats?.total_media || 0}
            icon={<FaList />}
          />
          <StatsCard
            title="Movies"
            value={stats?.total_movies || 0}
            icon={<FaFilm />}
          />
          <StatsCard
            title="TV Shows"
            value={stats?.total_tv_shows || 0}
            icon={<FaTv />}
          />
          <StatsCard
            title="Watching"
            value={stats?.watching || 0}
            icon={<FaClock />}
          />
          <StatsCard
            title="Completed"
            value={stats?.completed || 0}
            icon={<FaCheck />}
          />
          <StatsCard
            title="Watchlist"
            value={stats?.watchlist || 0}
            icon={<FaStar />}
          />
        </div>
      </div>

      {/*charts section*/}
      <div className="charts-section">
        {/*platform distribution*/}
        <div className="chart-card">
          <h2>Platform Distribution</h2>
          {platformData.length > 0 ? (
            <div className="chart-content">
              {platformData.map((item) => {
                const total = platformData.reduce((sum, p) => sum + p.count, 0);
                const percentage = Math.round((item.count / total) * 100);
                return (
                  <div key={item.platform} className="chart-item">
                    <div className="chart-label">
                      <span className="label-name">{item.platform || "Other"}</span>
                      <span className="label-value">{item.count}</span>
                    </div>
                    <div className="chart-bar">
                      <div
                        className="chart-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-chart">No platform data available</p>
          )}
        </div>

        {/*genre distribution*/}
        <div className="chart-card">
          <h2>Genre Distribution</h2>
          {genreData.length > 0 ? (
            <div className="chart-content">
              {genreData.map((item) => {
                const total = genreData.reduce((sum, g) => sum + g.count, 0);
                const percentage = Math.round((item.count / total) * 100);
                return (
                  <div key={item.name} className="chart-item">
                    <div className="chart-label">
                      <span className="label-name">{item.name}</span>
                      <span className="label-value">{item.count}</span>
                    </div>
                    <div className="chart-bar">
                      <div
                        className="chart-fill genre-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-chart">No genre data available</p>
          )}
        </div>

        {/*status distribution*/}
        <div className="chart-card">
          <h2>Status Distribution</h2>
          {statusData.length > 0 ? (
            <div className="chart-content">
              {statusData.map((item) => {
                const total = statusData.reduce((sum, s) => sum + s.count, 0);
                const percentage = Math.round((item.count / total) * 100);
                return (
                  <div key={item.name} className="chart-item">
                    <div className="chart-label">
                      <span className="label-name">{item.name}</span>
                      <span className="label-value">{item.count}</span>
                    </div>
                    <div className="chart-bar">
                      <div
                        className="chart-fill"
                        style={{
                          width: `${percentage}%`,
                          background: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-chart">No status data available</p>
          )}
        </div>

        {/*movies vs tv shows*/}
        <div className="chart-card">
          <h2>Movies vs TV Shows</h2>
          {totalMedia > 0 ? (
            <div className="comparison-chart">
              <div className="comparison-item">
                <div className="comparison-header">
                  <FaFilm className="comparison-icon movies" />
                  <span className="comparison-label">Movies</span>
                  <span className="comparison-percentage">{moviesPercentage}%</span>
                </div>
                <div className="comparison-bar">
                  <div
                    className="comparison-fill movies-fill"
                    style={{ width: `${moviesPercentage}%` }}
                  />
                </div>
                <span className="comparison-count">{stats?.total_movies || 0} movies</span>
              </div>

              <div className="comparison-item">
                <div className="comparison-header">
                  <FaTv className="comparison-icon tv" />
                  <span className="comparison-label">TV Shows</span>
                  <span className="comparison-percentage">{tvShowsPercentage}%</span>
                </div>
                <div className="comparison-bar">
                  <div
                    className="comparison-fill tv-fill"
                    style={{ width: `${tvShowsPercentage}%` }}
                  />
                </div>
                <span className="comparison-count">{stats?.total_tv_shows || 0} TV shows</span>
              </div>
            </div>
          ) : (
            <p className="empty-chart">No media data available</p>
          )}
        </div>

        {/*watchlist vs completed*/}
        <div className="chart-card">
          <h2>Watchlist vs Completed</h2>
          {totalTracked > 0 ? (
            <div className="comparison-chart">
              <div className="comparison-item">
                <div className="comparison-header">
                  <FaList className="comparison-icon watchlist" />
                  <span className="comparison-label">Watchlist</span>
                  <span className="comparison-percentage">{watchlistPercentage}%</span>
                </div>
                <div className="comparison-bar">
                  <div
                    className="comparison-fill watchlist-fill"
                    style={{ width: `${watchlistPercentage}%` }}
                  />
                </div>
                <span className="comparison-count">{watchlistCount} items</span>
              </div>

              <div className="comparison-item">
                <div className="comparison-header">
                  <FaCheck className="comparison-icon completed" />
                  <span className="comparison-label">Completed</span>
                  <span className="comparison-percentage">{completedPercentage}%</span>
                </div>
                <div className="comparison-bar">
                  <div
                    className="comparison-fill completed-fill"
                    style={{ width: `${completedPercentage}%` }}
                  />
                </div>
                <span className="comparison-count">{completedCount} items</span>
              </div>
            </div>
          ) : (
            <p className="empty-chart">No tracking data available</p>
          )}
        </div>
      </div>

      {/*top lists section*/}
      <div className="top-lists-section">
        {/*top rated*/}
        <div className="top-list-card">
          <h2>Top 5 Highest Rated</h2>
          {topRated.length > 0 ? (
            <div className="top-list">
              {topRated.map((media, index) => (
                <div
                  key={media.id}
                  className="top-list-item"
                  onClick={() => navigate(`/media/${media.id}`)}
                >
                  <span className="rank">#{index + 1}</span>
                  <div className="top-item-info">
                    <span className="top-item-title">{media.title}</span>
                    <span className="top-item-type">
                      {media.media_type === "movie" ? "Movie" : "TV Show"}
                    </span>
                  </div>
                  <div className="top-item-rating">
                    <FaStar />
                    <span>{media.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-list">No rated media yet</p>
          )}
        </div>

        {/*recently completed*/}
        <div className="top-list-card">
          <h2>Recently Completed</h2>
          {recentlyCompleted.length > 0 ? (
            <div className="top-list">
              {recentlyCompleted.map((media, index) => (
                <div
                  key={media.id}
                  className="top-list-item"
                  onClick={() => navigate(`/media/${media.id}`)}
                >
                  <span className="rank">#{index + 1}</span>
                  <div className="top-item-info">
                    <span className="top-item-title">{media.title}</span>
                    <span className="top-item-type">
                      {media.media_type === "movie" ? "Movie" : "TV Show"}
                    </span>
                  </div>
                  {media.rating && (
                    <div className="top-item-rating">
                      <FaStar />
                      <span>{media.rating}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-list">No completed media yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stats;