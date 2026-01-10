import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ContributionChart = ({ contributors }) => {
    const colors = ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

    return (
        <div className="contribution-chart">
            <h3 className="chart-title">Contributor Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={contributors} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                        dataKey="name"
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1f2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                    />
                    <Bar dataKey="activityScore" radius={[8, 8, 0, 0]}>
                        {contributors.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <div className="contributor-list">
                {contributors.map((contributor, index) => (
                    <div key={contributor.userId} className="contributor-item">
                        <div className="contributor-info">
                            <span className="contributor-name">{contributor.name}</span>
                            <span className="contributor-stats">
                                {contributor.edits} edits • {contributor.comments} comments
                            </span>
                        </div>
                        <div className="contributor-score">
                            <div
                                className="score-bar"
                                style={{
                                    width: `${contributor.activityPercentage}%`,
                                    backgroundColor: colors[index % colors.length]
                                }}
                            />
                            <span className="score-text">{contributor.activityPercentage}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ContributionChart;
