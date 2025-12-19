import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSearch } from "react-icons/fa";

import MediaCard from "../components/MediaCard";
import "./TVShows.css";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

const TVShows = () => {
  const navigate = useNavigate();

  const [tvShows, setTVShows] = useState([]);
  const [genres, setGenres] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [ordering, setOrdering] = useState("-created_at");

  useEffect(() => {
    fetchGenres();
    fetchPlatforms();
  }, []);

  useEffect(() => {
    fetchTVShows();
  }, [searchTerm, selectedStatus, selectedPlatform, selectedGenre, ordering]);

  const fetchGenres = async () => {
    try {
      const res = await api.get("/genres/");
      setGenres(res.data || []);
    } catch {
      setGenres([]);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const res = await api.get("/media/", {
        params: { media_type: "tv_show" },
      });

      const uniquePlatforms = [
        ...new Set((res.data || []).map(item => item.platform).filter(Boolean)),
      ].sort();

      setPlatforms(uniquePlatforms);
    } catch {
      setPlatforms([]);
    }
  };

  const fetchTVShows = async () => {
    setLoading(true);

    try {
      const params = {
        media_type: "tv_show",
        ordering,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPlatform) params.platform = selectedPlatform;
      if (selectedGenre) params.genre = selectedGenre;

      const res = await api.get("/media/", { params });
      setTVShows(res.data || []);
    } catch {
      setTVShows([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("");
    setSelectedPlatform("");
    setSelectedGenre("");
    setOrdering("-created_at");
  };

  const hasActiveFilters =
    searchTerm ||
    selectedStatus ||
    selectedPlatform ||
    selectedGenre ||
    ordering !== "-created_at";

  return (
    <div className="tv-shows-page">
      {/*header*/}
      <div className="tv-shows-header">
        <div>
          <h1>TV Shows</h1>
          <p>Browse and manage your TV show collection</p>
        </div>

        <button
          className="btn-primary"
          onClick={() => navigate("/add-media")}
        >
          + Add TV Show
        </button>
      </div>

      {/*search*/}
      <div className="tv-shows-controls">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search TV shows by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/*filters*/}
      <div className="filters-panel">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="watching">Watching</option>
              <option value="completed">Completed</option>
              <option value="watchlist">Watchlist</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
            >
              <option value="">All Platforms</option>
              {platforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Genre</label>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
            >
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.name}>
                  {genre.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="title">Title A-Z</option>
              <option value="-title">Title Z-A</option>
              <option value="-rating">Highest Rated</option>
              <option value="rating">Lowest Rated</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button className="clear-filters" onClick={clearFilters}>
            Clear All Filters
          </button>
        )}
      </div>

      {/*content*/}
      <div className="tv-shows-content">
        {loading ? (
          <p className="loading">Loading TV shows...</p>
        ) : tvShows.length === 0 ? (
          <div className="empty-state">
            <p>No TV shows found</p>
            {hasActiveFilters && (
              <button className="btn-secondary" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="results-info">
              <span>
                {tvShows.length}{" "}
                {tvShows.length === 1 ? "TV show" : "TV shows"} found
              </span>
            </div>

            <div className="tv-shows-grid">
              {tvShows.map((tvShow) => (
                <MediaCard
                  key={tvShow.id}
                  media={tvShow}
                  onClick={() => navigate(`/media/${tvShow.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TVShows;
