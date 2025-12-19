import { FaFilm, FaTv, FaStar } from "react-icons/fa";
import "./MediaCard.css";

const MediaCard = ({ media, onClick }) => {
  const isTVShow = media.media_type === "tv_show";

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

        <div className="media-genres">
          {media.genres?.map((genre) => (
            <span key={genre.id} className="genre-tag">
              {genre.name}
            </span>
          ))}
        </div>
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
