import { FaFilm, FaTv, FaStar, FaRobot } from "react-icons/fa";
import "./MediaCard.css";

const MediaCard = ({ media, onClick }) => {
  const isTVShow = media.media_type === "tv_show";
  const showAiPreview = !!media.ai_review_summary;

  console.log({
  title: media.title,
  status: media.status,
  ai: media.ai_review_summary,
});

  return (
    <div className="media-card" onClick={onClick}>
      <div className="media-card-header">
        <div className="media-type">
          {isTVShow ? <FaTv /> : <FaFilm />}
          <span>{isTVShow ? "TV Show" : "Movie"}</span>
        </div>

        {media.platform && (
          <span className="platform-text">{media.platform}</span>
        )}
      </div>

      <div className="media-card-body">
        <h3 className="media-title">{media.title}</h3>

        {media.director && (
          <p className="media-director">by {media.director}</p>
        )}

        {/* AI summary preview (only for completed items) */}
        {showAiPreview && (
          <div className="ai-preview">
            <FaRobot className="ai-preview-icon" />
            <p className="ai-preview-text">
              {media.ai_review_summary.length > 80
                ? media.ai_review_summary.slice(0, 80) + "…"
                : media.ai_review_summary}
            </p>
          </div>
        )}

        {media.genres?.length > 0 && (
          <div className="media-genres">
            {media.genres.map((genre) => (
              <span key={genre.id} className="genre-tag">
                {genre.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="media-card-footer">
        <span className={`status-badge ${media.status}`}>
          {media.status}
        </span>

        {media.rating && (
          <div className="media-rating">
            <FaStar />
            <span>{media.rating}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaCard;