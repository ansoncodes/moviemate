import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import MediaCard from "../components/MediaCard";
import "./Movies.css";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

const Movies = () => {
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [ordering, setOrdering] = useState("-created_at");

  useEffect(() => {
    fetchGenres();
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [searchTerm, selectedStatus, selectedPlatform, selectedGenre, ordering]);

  const fetchGenres = async () => {
    try {
      const res = await api.get("/genres/");
      setGenres(res.data || []);
    } catch (err) {
      console.error("Failed to fetch genres");
    }
  };

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const params = {
        media_type: "movie",
        ordering,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPlatform) params.platform = selectedPlatform;
      if (selectedGenre) params.genre = selectedGenre;

      const res = await api.get("/media/", { params });
      setMovies(res.data || []);
    } catch (err) {
      console.error("Failed to fetch movies");
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const platforms = [
    ...new Set(movies.map((m) => m.platform).filter(Boolean)),
  ].sort();

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
    <div className="movies-page">
      <div className="movies-header">
        <div>
          <h1>Movies</h1>
          <p>Browse and manage your movie collection</p>
        </div>

        <button className="btn-primary" onClick={() => navigate("/add-media")}>
          + Add Movie
        </button>
      </div>

      <div className="movies-controls">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search movies by title or director..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

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

      <div className="movies-content">
        {loading ? (
          <p className="loading">Loading movies...</p>
        ) : movies.length === 0 ? (
          <div className="empty-state">
            <p>No movies found</p>
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
                {movies.length} {movies.length === 1 ? "movie" : "movies"} found
              </span>
            </div>

            <div className="movies-grid">
              {movies.map((movie) => (
                <MediaCard
                  key={movie.id}
                  media={movie}
                  onClick={() => navigate(`/media/${movie.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Movies;