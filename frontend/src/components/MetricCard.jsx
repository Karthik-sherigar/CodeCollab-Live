const MetricCard = ({ icon, value, label, color = '#a855f7' }) => {
    return (
        <div className="metric-card" style={{ borderColor: color }}>
            <div className="metric-icon" style={{ color }}>
                {icon}
            </div>
            <div className="metric-content">
                <div className="metric-value">{value}</div>
                <div className="metric-label">{label}</div>
            </div>
        </div>
    );
};

export default MetricCard;
