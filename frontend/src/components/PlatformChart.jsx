import "./PlatformChart.css";

const PlatformChart = ({ data = [] }) => {
  if (!data.length) {
    return <div className="platform-chart empty">No platform data</div>;
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="platform-chart">
      

      <div className="chart-list">
        {data.map((item) => {
          const percentage = Math.round((item.count / total) * 100);

          return (
            <div key={item.platform} className="chart-row">
              <div className="chart-label">
                <span className="platform-name">
                  {item.platform || "Other"}
                </span>
                <span className="platform-count">{item.count}</span>
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
    </div>
  );
};

export default PlatformChart;
