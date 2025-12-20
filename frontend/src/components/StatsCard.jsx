import "./StatsCard.css";

const StatsCard = ({ title, value, icon }) => {
  return (
    <div className="stats-card">
      <div className="stats-header">
        {icon && <span className="stats-icon">{icon}</span>}
        <span className="stats-title">{title}</span>
      </div>

      <div className="stats-value">{value}</div>
    </div>
  );
};

export default StatsCard;
