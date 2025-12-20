import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaStar, FaCalendar, FaTv, FaUser, FaPlus, FaCheck, FaMinus, FaRobot } from "react-icons/fa";
import "./MediaDetail.css";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

const MediaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [media, setMedia] = useState(null);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  const [episodeChanges, setEpisodeChanges] = useState({});
  const [savingProgress, setSavingProgress] = useState({});
  const [error, setError] = useState("");
  
  // FIXED: Separate state for custom platform input visibility and value
  const [platformSelection, setPlatformSelection] = useState("");
  const [customPlatform, setCustomPlatform] = useState("");

  const [formData, setFormData] = useState({
    title: "", director: "", platform: "", status: "", rating: "", review: "", genre_ids: [],
  });

  const [seasonForm, setSeasonForm] = useState({ season_number: "", total_episodes: "" });

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/media/${id}/`);
      const mediaData = res.data;
      
      const processMediaData = (data) => {
        setMedia(data);
        setFormData({
          title: data.title,
          director: data.director || "",
          platform: data.platform || "",
          status: data.status,
          rating: data.rating || "",
          review: data.review || "",
          genre_ids: data.genres.map((g) => g.id),
        });
        
        // FIXED: Initialize platform selection state
        const platforms = ["Netflix", "Prime Video", "Disney+", "HBO Max", "Apple TV+", "Hulu", "Paramount+", "Peacock", "YouTube", "Crunchyroll"];
        if (data.platform) {
          if (platforms.includes(data.platform)) {
            setPlatformSelection(data.platform);
            setCustomPlatform("");
          } else {
            setPlatformSelection("Other");
            setCustomPlatform(data.platform);
          }
        } else {
          setPlatformSelection("");
          setCustomPlatform("");
        }
        
        if (data.tv_details?.seasons) {
          const initialChanges = {};
          data.tv_details.seasons.forEach(season => {
            initialChanges[season.id] = season.episodes_watched || 0;
          });
          setEpisodeChanges(initialChanges);
        }
      };

      if (mediaData.media_type === "tv_show" && !mediaData.tv_details) {
        try {
          await api.post("/tv-details/", { media: mediaData.id });
          const updatedRes = await api.get(`/media/${id}/`);
          processMediaData(updatedRes.data);
        } catch {
          processMediaData(mediaData);
        }
      } else {
        processMediaData(mediaData);
      }
    } catch {
      // failed to load
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchGenres = useCallback(async () => {
    try {
      const res = await api.get("/genres/");
      setGenres(res.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchMedia();
    fetchGenres();
  }, [fetchMedia, fetchGenres]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "status") {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        rating: value !== "completed" ? "" : prev.rating
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // FIXED: Handle platform selection change
  const handlePlatformSelectChange = (e) => {
    const { value } = e.target;
    setPlatformSelection(value);
    
    if (value === "Other") {
      // Keep the custom platform value if it exists, otherwise clear
      setFormData(prev => ({ 
        ...prev, 
        platform: customPlatform || "" 
      }));
    } else {
      setCustomPlatform("");
      setFormData(prev => ({ ...prev, platform: value }));
    }
  };

  // FIXED: Handle custom platform input change
  const handleCustomPlatformChange = (e) => {
    const { value } = e.target;
    setCustomPlatform(value);
    setFormData(prev => ({ ...prev, platform: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/media/${id}/`, formData);
      await fetchMedia();
      setIsEditing(false);
    } catch {}
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/media/${id}/`);
      navigate(media.media_type === "movie" ? "/movies" : "/tvshows");
    } catch {
      setShowDeleteModal(false);
    }
  };

  const handleEpisodeChange = (seasonId, value) => {
    setEpisodeChanges(prev => ({ ...prev, [seasonId]: parseInt(value) || 0 }));
  };

  const updateEpisodeCount = (seasonId, change, maxEpisodes = Infinity) => {
    setEpisodeChanges(prev => ({
      ...prev,
      [seasonId]: Math.max(0, Math.min((prev[seasonId] || 0) + change, maxEpisodes))
    }));
  };

  const markSeasonComplete = (seasonId, totalEpisodes) => {
    setEpisodeChanges(prev => ({ ...prev, [seasonId]: totalEpisodes }));
  };

  const handleSaveProgress = async (seasonId) => {
    setSavingProgress(prev => ({ ...prev, [seasonId]: true }));
    try {
      await api.patch(`/seasons/${seasonId}/progress/update/`, {
        episodes_watched: episodeChanges[seasonId]
      });
      await fetchMedia();
    } catch {
    } finally {
      setSavingProgress(prev => ({ ...prev, [seasonId]: false }));
    }
  };

  const handleSeasonSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      let tvDetailsId = media.tv_details?.id;
      
      if (!tvDetailsId) {
        try {
          const response = await api.post("/tv-details/", { media: parseInt(media.id) });
          tvDetailsId = response.data.id;
          await fetchMedia();
        } catch (err) {
          if (err.response?.status === 400 && err.response?.data?.media) {
            await fetchMedia();
            const updatedMedia = await api.get(`/media/${id}/`);
            tvDetailsId = updatedMedia.data.tv_details?.id;
            if (!tvDetailsId) return;
          } else {
            return;
          }
        }
      }

      const endpoint = editingSeason ? `/seasons/${editingSeason.id}/` : "/seasons/";
      const method = editingSeason ? "patch" : "post";
      const payload = editingSeason
        ? { season_number: parseInt(seasonForm.season_number), total_episodes: parseInt(seasonForm.total_episodes) }
        : { tv_details: tvDetailsId, season_number: parseInt(seasonForm.season_number), total_episodes: parseInt(seasonForm.total_episodes) };

      await api[method](endpoint, payload);
      
      await fetchMedia();
      setShowSeasonModal(false);
      setSeasonForm({ season_number: "", total_episodes: "" });
      setEditingSeason(null);
    } catch (err) {
      if (err.response?.data?.non_field_errors) {
        const errorMsg = Array.isArray(err.response.data.non_field_errors) 
          ? err.response.data.non_field_errors[0] 
          : err.response.data.non_field_errors;
        if (errorMsg.includes("already exists") || errorMsg.includes("season")) {
          setError("Season already exists");
          setTimeout(() => setError(""), 3000);
        }
      }
    }
  };

  const handleDeleteSeason = async (seasonId) => {
    if (!window.confirm("Delete this season?")) return;
    try {
      await api.delete(`/seasons/${seasonId}/`);
      await fetchMedia();
    } catch {}
  };

  const openSeasonModal = (season = null) => {
    setError("");
    setEditingSeason(season);
    setSeasonForm(season ? { season_number: season.season_number, total_episodes: season.total_episodes } : { season_number: "", total_episodes: "" });
    setShowSeasonModal(true);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FaStar key={i} className={i < rating ? "star" : "star empty"} />
    ));
  };

  const calculateProgress = (watched, total) => total > 0 ? (watched / total) * 100 : 0;

  // FIXED: Reset platform states when cancelling edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset platform states to current media values
    const platforms = ["Netflix", "Prime Video", "Disney+", "HBO Max", "Apple TV+", "Hulu", "Paramount+", "Peacock", "YouTube", "Crunchyroll"];
    if (media.platform) {
      if (platforms.includes(media.platform)) {
        setPlatformSelection(media.platform);
        setCustomPlatform("");
      } else {
        setPlatformSelection("Other");
        setCustomPlatform(media.platform);
      }
    }
  };

  if (loading) return <p className="loading">Loading...</p>;
  if (!media) return <p className="error">Media not found</p>;

  const isMovie = media.media_type === "movie";
  const isTVShow = media.media_type === "tv_show";
  const totalWatched = isTVShow ? media.tv_details?.seasons?.reduce((sum, s) => sum + (s.episodes_watched || 0), 0) || 0 : 0;
  const totalEpisodes = isTVShow ? media.tv_details?.total_episodes || 0 : 0;

  const platforms = ["Netflix", "Prime Video", "Disney+", "HBO Max", "Apple TV+", "Hulu", "Paramount+", "Peacock", "YouTube", "Crunchyroll"];

  return (
    <div className="media-detail-page">
      <button className="back-button" onClick={() => navigate(isMovie ? "/movies" : "/tvshows")}>
        <FaArrowLeft /> Back to {isMovie ? "Movies" : "TV Shows"}
      </button>

      {!isEditing ? (
        <>
          <div className="media-header">
            <div className="media-header-content">
              <div className="media-title-section">
                <h1><span className="media-type-badge">{isMovie ? "Movie" : "TV Show"}</span>{media.title}</h1>
                <div className="media-meta">
                  {media.director && <div className="meta-item"><FaUser className="meta-icon" /><span>{media.director}</span></div>}
                  {media.platform && <div className="meta-item"><FaTv className="meta-icon" /><span>{media.platform}</span></div>}
                  {media.completed_at && <div className="meta-item"><FaCalendar className="meta-icon" /><span>Completed: {new Date(media.completed_at).toLocaleDateString()}</span></div>}
                </div>
                <span className={`status-badge status-${media.status}`}>{media.status.charAt(0).toUpperCase() + media.status.slice(1)}</span>
                {media.genres?.length > 0 && (
                  <div className="genres-list">
                    {media.genres.map((genre) => <span key={genre.id} className="genre-tag">{genre.name}</span>)}
                  </div>
                )}
              </div>
              <div className="media-actions">
                <button className="btn-primary" onClick={() => setIsEditing(true)}>Edit {isMovie ? "Movie" : "Show"}</button>
                <button className="btn-danger" onClick={() => setShowDeleteModal(true)}>Delete</button>
              </div>
            </div>
          </div>

          {isTVShow && (
            <div className="media-stats">
              <div className="stat-card"><div className="stat-label">Total Seasons</div><div className="stat-value">{media.tv_details?.total_seasons || 0}</div></div>
              <div className="stat-card"><div className="stat-label">Total Episodes</div><div className="stat-value">{totalEpisodes}</div></div>
              <div className="stat-card"><div className="stat-label">Episodes Watched</div><div className="stat-value">{totalWatched}</div></div>
              <div className="stat-card"><div className="stat-label">Progress</div><div className="stat-value">{totalEpisodes > 0 ? `${Math.round((totalWatched / totalEpisodes) * 100)}%` : "0%"}</div></div>
            </div>
          )}

          {media.ai_review_summary && (
            <div className="ai-summary-section">
              <div className="ai-summary-header">
                <FaRobot className="ai-icon" />
                <h2>AI Summary</h2>
              </div>
              <p className="ai-summary-text">{media.ai_review_summary}</p>
            </div>
          )}

          <div className="rating-section">
            <h2>Rating</h2>
            {media.rating ? (
              <div className="rating-display">
                <div className="rating-stars">{renderStars(media.rating)}</div>
                <span className="rating-value">{media.rating} / 5</span>
              </div>
            ) : <p className="no-rating">No rating yet</p>}
          </div>

          <div className="review-section">
            <h2>Review</h2>
            {media.review ? <p className="review-text">{media.review}</p> : <p className="no-review">No review written yet</p>}
          </div>

          {isTVShow && (
            <div className="seasons-section">
              <div className="seasons-header">
                <h2>Seasons & Episodes</h2>
                <button className="btn-success" disabled={!media.tv_details} onClick={() => openSeasonModal()}><FaPlus /> Add Season</button>
              </div>

              {media.tv_details?.seasons?.length > 0 ? (
                <div className="seasons-list">
                  {media.tv_details.seasons.map((season) => {
                    const currentWatched = season.episodes_watched || 0;
                    const displayWatched = episodeChanges[season.id] ?? currentWatched;
                    const isComplete = displayWatched === season.total_episodes;
                    const hasChanges = episodeChanges[season.id] !== currentWatched;

                    return (
                      <div key={season.id} className="season-card">
                        <div className="season-header">
                          <h3 className="season-title">Season {season.season_number}{isComplete && <span className="complete-badge">✓ Complete</span>}</h3>
                          <div className="season-actions">
                            <button className="btn-secondary btn-small" onClick={() => openSeasonModal(season)}>Edit</button>
                            <button className="btn-danger btn-small" onClick={() => handleDeleteSeason(season.id)}>Delete</button>
                          </div>
                        </div>
                        <div className="season-info">
                          <div className="season-info-item"><strong>Total Episodes:</strong> {season.total_episodes}</div>
                          <div className="season-info-item"><strong>Watched:</strong> {displayWatched} / {season.total_episodes}</div>
                        </div>
                        <div className="progress-bar-container">
                          <div className="progress-label">
                            <span>Progress</span>
                            <span>{Math.round(calculateProgress(displayWatched, season.total_episodes))}%</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${calculateProgress(displayWatched, season.total_episodes)}%` }}></div>
                          </div>
                        </div>
                        <div className="episode-controls">
                          <div className="episode-control-group">
                            <button className="btn-control" onClick={() => updateEpisodeCount(season.id, -1)} disabled={displayWatched === 0}><FaMinus /></button>
                            <input type="number" className="episode-input" min="0" max={season.total_episodes} value={displayWatched} onChange={(e) => handleEpisodeChange(season.id, e.target.value)} />
                            <button className="btn-control" onClick={() => updateEpisodeCount(season.id, 1, season.total_episodes)} disabled={displayWatched === season.total_episodes}><FaPlus /></button>
                            <button className="btn-mark-complete" onClick={() => markSeasonComplete(season.id, season.total_episodes)} disabled={isComplete}><FaCheck /> Mark Complete</button>
                          </div>
                          {hasChanges && (
                            <button className="btn-save-progress" onClick={() => handleSaveProgress(season.id)} disabled={savingProgress[season.id]}>
                              {savingProgress[season.id] ? "Saving..." : "Save Progress"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-seasons">
                  <p>No seasons added yet</p>
                  <button className="btn-primary" onClick={() => openSeasonModal()}><FaPlus /> Add Your First Season</button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="edit-form">
          <h2>Edit {isMovie ? "Movie" : "TV Show"}</h2>
          <form onSubmit={handleUpdate}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Title *</label>
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleInputChange} 
                  required 
                  placeholder="Enter title"
                />
              </div>

              <div className="form-group">
                <label>Director</label>
                <input 
                  type="text" 
                  name="director" 
                  value={formData.director} 
                  onChange={handleInputChange} 
                  placeholder="Enter director name"
                />
              </div>

              <div className="form-group">
                <label>Platform</label>
                <select 
                  name="platformSelect" 
                  value={platformSelection}
                  onChange={handlePlatformSelectChange}
                >
                  <option value="">Select platform</option>
                  {platforms.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
                {platformSelection === "Other" && (
                  <input 
                    type="text" 
                    name="customPlatform" 
                    value={customPlatform} 
                    onChange={handleCustomPlatformChange} 
                    placeholder="Enter custom platform"
                    style={{ marginTop: "0.5rem" }}
                  />
                )}
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="watchlist">Watchlist</option>
                  <option value="watching">Watching</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Genres</label>
                <div className="genre-chips">
                  {genres.map((genre) => (
                    <button
                      key={genre.id}
                      type="button"
                      className={`genre-chip ${formData.genre_ids.includes(genre.id) ? 'selected' : ''}`}
                      onClick={() => {
                        const newGenreIds = formData.genre_ids.includes(genre.id)
                          ? formData.genre_ids.filter(id => id !== genre.id)
                          : [...formData.genre_ids, genre.id];
                        setFormData(prev => ({ ...prev, genre_ids: newGenreIds }));
                      }}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group full-width">
                <label>
                  Rating (1-5)
                  {formData.status !== "completed" && (
                    <span className="rating-note"> (Available only when status is "Completed")</span>
                  )}
                </label>
                {formData.status === "completed" ? (
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={`star ${star <= (formData.rating || 0) ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, rating: star.toString() }))}
                      />
                    ))}
                    {formData.rating > 0 && (
                      <span className="rating-value">{formData.rating}</span>
                    )}
                  </div>
                ) : (
                  <input 
                    type="number" 
                    name="rating" 
                    value={formData.rating} 
                    onChange={handleInputChange} 
                    min="1" 
                    max="5" 
                    step="0.1" 
                    disabled 
                    placeholder="Complete to rate"
                  />
                )}
              </div>

              <div className="form-group full-width">
                <label>Review</label>
                <textarea 
                  name="review" 
                  value={formData.review} 
                  onChange={handleInputChange} 
                  placeholder="Write your review..." 
                  rows="5"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Save Changes</button>
              <button type="button" className="btn-secondary" onClick={handleCancelEdit}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete {isMovie ? "Movie" : "TV Show"}</h3>
            <p>Delete "{media.title}"? This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
              <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isTVShow && showSeasonModal && (
        <div className="modal-overlay" onClick={() => setShowSeasonModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingSeason ? "Edit Season" : "Add New Season"}</h3>
            {error && <div className="error" style={{ marginBottom: "1rem" }}>{error}</div>}
            <form onSubmit={handleSeasonSubmit}>
              <div className="form-group"><label>Season Number *</label><input type="number" min="1" value={seasonForm.season_number} onChange={(e) => setSeasonForm(prev => ({ ...prev, season_number: e.target.value }))} placeholder="e.g., 1" required /></div>
              <div className="form-group"><label>Total Episodes *</label><input type="number" min="1" value={seasonForm.total_episodes} onChange={(e) => setSeasonForm(prev => ({ ...prev, total_episodes: e.target.value }))} placeholder="e.g., 10" required /></div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">{editingSeason ? "Update Season" : "Add Season"}</button>
                <button type="button" className="btn-secondary" onClick={() => { setShowSeasonModal(false); setEditingSeason(null); setSeasonForm({ season_number: "", total_episodes: "" }); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaDetail;