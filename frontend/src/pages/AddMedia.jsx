import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaStar, FaPlus, FaTrash } from "react-icons/fa";

import "./AddMedia.css";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
});

const PLATFORMS = [
  "Netflix",
  "Prime Video",
  "Disney+",
  "HBO Max",
  "Apple TV+",
  "Hulu",
  "Paramount+",
  "Peacock",
  "YouTube",
  "Crunchyroll",
  "Other"
];

const AddMedia = () => {
  const navigate = useNavigate();

  const [genres, setGenres] = useState([]);
  const [form, setForm] = useState({
    title: "",
    media_type: "movie",
    status: "watchlist",
    platform: "",
    director: "",
    rating: "",
    genre_ids: [],
  });

  const [seasons, setSeasons] = useState([]);
  const [showCustomPlatform, setShowCustomPlatform] = useState(false);
  const [customPlatform, setCustomPlatform] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const res = await api.get("/genres/");
      setGenres(res.data || []);
    } catch (err) {
      console.error("Failed to fetch genres");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "platform") {
      if (value === "Other") {
        setShowCustomPlatform(true);
        setForm(prev => ({ ...prev, platform: "" }));
      } else {
        setShowCustomPlatform(false);
        setCustomPlatform("");
        setForm(prev => ({ ...prev, platform: value }));
      }
    } else if (name === "status") {
      setForm(prev => ({ 
        ...prev, 
        [name]: value,
        rating: value !== "completed" ? "" : prev.rating
      }));
    } else if (name === "media_type") {
      setForm(prev => ({ ...prev, [name]: value }));
      // Clear seasons when switching to movie
      if (value === "movie") {
        setSeasons([]);
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCustomPlatformChange = (e) => {
    const value = e.target.value;
    setCustomPlatform(value);
    setForm(prev => ({ ...prev, platform: value }));
  };

  const handleGenreToggle = (genreId) => {
    setForm(prev => ({
      ...prev,
      genre_ids: prev.genre_ids.includes(genreId)
        ? prev.genre_ids.filter(id => id !== genreId)
        : [...prev.genre_ids, genreId]
    }));
  };

  const handleStarClick = (rating) => {
    if (form.status === "completed") {
      setForm(prev => ({ ...prev, rating: rating.toString() }));
    }
  };

  const addSeason = () => {
    setSeasons(prev => [...prev, { season_number: "", total_episodes: "" }]);
  };

  const removeSeason = (index) => {
    setSeasons(prev => prev.filter((_, i) => i !== index));
  };

  const updateSeason = (index, field, value) => {
    setSeasons(prev => prev.map((season, i) => 
      i === index ? { ...season, [field]: value } : season
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        title: form.title.trim(),
        media_type: form.media_type,
        status: form.status,
        platform: form.platform.trim() || null,
        director: form.director.trim() || null,
        genre_ids: form.genre_ids.length > 0 ? form.genre_ids : [],
      };

      // Only include rating if status is completed
      if (form.status === "completed" && form.rating) {
        payload.rating = Number(form.rating);
      }

      // Create the media first
      const mediaRes = await api.post("/media/", payload);
      const mediaId = mediaRes.data.id;

      // If it's a TV show and has seasons, create them
      if (form.media_type === "tv_show" && seasons.length > 0) {
        // Ensure TV details exist
        let tvDetailsId;
        try {
          const tvDetailsRes = await api.post("/tv-details/", { media: mediaId });
          tvDetailsId = tvDetailsRes.data.id;
        } catch (err) {
          // TV details might already exist
          const mediaDetail = await api.get(`/media/${mediaId}/`);
          tvDetailsId = mediaDetail.data.tv_details?.id;
        }

        if (tvDetailsId) {
          // Create each season
          for (const season of seasons) {
            if (season.season_number && season.total_episodes) {
              await api.post("/seasons/", {
                tv_details: tvDetailsId,
                season_number: parseInt(season.season_number),
                total_episodes: parseInt(season.total_episodes)
              });
            }
          }
        }
      }

      navigate("/");
    } catch (err) {
      const errorMsg = err.response?.data?.title?.[0] || 
                       err.response?.data?.genre_ids?.[0] ||
                       err.response?.data?.non_field_errors?.[0] ||
                       "Failed to add media. Please check all fields.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const isCompleted = form.status === "completed";
  const currentRating = form.rating ? Number(form.rating) : 0;
  const isTVShow = form.media_type === "tv_show";

  return (
    <div className="add-media">
      <div className="add-media-header">
        <div>
          <h1>Add Media</h1>
          <p>Add a new movie or TV show to your library</p>
        </div>

        <button 
          type="button"
          className="btn-secondary" 
          onClick={() => navigate(-1)}
        >
          Cancel
        </button>
      </div>

      <form className="add-media-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group full-width">
            <label>Title *</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Enter movie or TV show title"
            />
          </div>

          <div className="form-group">
            <label>Type *</label>
            <select
              name="media_type"
              value={form.media_type}
              onChange={handleChange}
              required
            >
              <option value="movie">Movie</option>
              <option value="tv_show">TV Show</option>
            </select>
          </div>

          <div className="form-group">
            <label>Status *</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              required
            >
              <option value="watchlist">Watchlist</option>
              <option value="watching">Watching</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Platform</label>
            <select
              name="platform"
              value={showCustomPlatform ? "Other" : form.platform}
              onChange={handleChange}
            >
              <option value="">Select platform</option>
              {PLATFORMS.map(platform => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>

          {showCustomPlatform && (
            <div className="form-group">
              <label>Enter Platform Name</label>
              <input
                value={customPlatform}
                onChange={handleCustomPlatformChange}
                placeholder="Enter platform name"
              />
            </div>
          )}

          <div className="form-group">
            <label>Director</label>
            <input
              name="director"
              value={form.director}
              onChange={handleChange}
              placeholder="Enter director name"
            />
          </div>

          <div className="form-group full-width">
            <label>Genres</label>
            <div className="genre-chips">
              {genres.map(genre => (
                <button
                  key={genre.id}
                  type="button"
                  className={`genre-chip ${form.genre_ids.includes(genre.id) ? 'selected' : ''}`}
                  onClick={() => handleGenreToggle(genre.id)}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group full-width">
            <label>
              Rating
              {!isCompleted && <span className="rating-note"> (Available only when status is "Completed")</span>}
            </label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <FaStar
                  key={star}
                  className={`star ${star <= (hoverRating || currentRating) ? 'active' : ''} ${!isCompleted ? 'disabled' : ''}`}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => isCompleted && setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                />
              ))}
              {isCompleted && currentRating > 0 && (
                <span className="rating-value">{currentRating}.0</span>
              )}
            </div>
          </div>

          {/*seasons section only for TV shows*/}
          {isTVShow && (
            <div className="form-group full-width seasons-section">
              <div className="seasons-header">
                <label>Seasons (Optional)</label>
                <button
                  type="button"
                  className="btn-success add-season-btn"
                  onClick={addSeason}
                >
                  <FaPlus /> Add Season
                </button>
              </div>

              {seasons.length > 0 && (
                <div className="seasons-list">
                  {seasons.map((season, index) => (
                    <div key={index} className="season-item">
                      <div className="season-input-group">
                        <label>Season Number *</label>
                        <input
                          type="number"
                          min="1"
                          value={season.season_number}
                          onChange={(e) => updateSeason(index, "season_number", e.target.value)}
                          placeholder="e.g., 1"
                          required
                        />
                      </div>
                      <div className="season-input-group">
                        <label>Total Episodes *</label>
                        <input
                          type="number"
                          min="1"
                          value={season.total_episodes}
                          onChange={(e) => updateSeason(index, "total_episodes", e.target.value)}
                          placeholder="e.g., 10"
                          required
                        />
                      </div>
                      <div className="season-actions">
                        <button
                          type="button"
                          className="btn-danger remove-season-btn"
                          onClick={() => removeSeason(index)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {seasons.length === 0 && (
                <p className="no-seasons-message">
                  No seasons added yet. Click "Add Season" to add seasons.
                </p>
              )}
            </div>
          )}
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
          >
            {loading ? "Saving..." : "Add Media"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMedia;