import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { getPreloadedProductivityData } from '../utils/preloadCache';
import './DeveloperProductivity.css';

interface DeveloperProductivity {
  claude_adoption_date: string;
  days_using_claude: number;
  productivity_improvement: number;
  time_saved_hours: number;
  before_claude_avg_hours: number;
  after_claude_avg_hours: number;
  efficiency_score: number;
  learning_acceleration: number;
  monthly_comparison: Array<{
    month: string;
    avg_hours_per_issue: number;
    completed_hours: number;
    issues_completed: number;
    period: string;
    efficiency_rating: number;
  }>;
  achievements: string[];
}

const DeveloperProductivity: React.FC = () => {
  const initialData = getPreloadedProductivityData();
  const [productivity, setProductivity] = useState<DeveloperProductivity | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProductivityData = async (forceRefresh = false) => {
    try {
      if (!productivity) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      const url = forceRefresh 
        ? `http://localhost:8089/api/developer-productivity?_t=${Date.now()}`
        : 'http://localhost:8089/api/developer-productivity';
        
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setProductivity(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching developer productivity:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch productivity data');
      
      if (!productivity) {
        setLoading(false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      console.log('⚡ Developer Productivity: Using preloaded data for instant display');
      setTimeout(() => fetchProductivityData(), 100);
    } else {
      fetchProductivityData();
    }
    
    const interval = setInterval(() => fetchProductivityData(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="developer-productivity">
        <div className="productivity-header">
          <div className="loading">Carregando dados de produtividade...</div>
        </div>
      </div>
    );
  }

  if (error && !productivity) {
    return (
      <div className="developer-productivity">
        <div className="productivity-header">
          <div className="error">
            <h3>Erro ao carregar dados</h3>
            <p>{error}</p>
            <button onClick={() => fetchProductivityData()} className="refresh-btn">
              🔄 Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!productivity) return null;

  // Prepare radar chart data
  // Calculate consistency from variance in monthly performance (lower variance = higher consistency)
  const monthlyHours = productivity.monthly_comparison.map(m => m.avg_hours_per_issue);
  const avgHours = monthlyHours.reduce((a, b) => a + b, 0) / monthlyHours.length;
  const variance = monthlyHours.reduce((acc, hour) => acc + Math.pow(hour - avgHours, 2), 0) / monthlyHours.length;
  const standardDeviation = Math.sqrt(variance);
  const consistencyScore = Math.max(0, Math.min(100, 100 - (standardDeviation / avgHours) * 100));
  
  const radarData = [
    { metric: 'Produtividade', value: productivity.productivity_improvement },
    { metric: 'Eficiência', value: productivity.efficiency_score },
    { metric: 'Velocidade', value: Math.min(100, ((productivity.before_claude_avg_hours - productivity.after_claude_avg_hours) / productivity.before_claude_avg_hours) * 100) },
    { metric: 'Aprendizado', value: productivity.learning_acceleration },
    { metric: 'Consistência', value: consistencyScore }
  ];

  // Prepare bar chart data
  const timeComparisonData = [
    { period: 'Antes do Claude', hours: productivity.before_claude_avg_hours, fill: '#EF4444' },
    { period: 'Com Claude Code', hours: productivity.after_claude_avg_hours, fill: '#10B981' }
  ];

  return (
    <div className="developer-productivity">
      {/* Header */}
      <header className="productivity-header">
        <div className="header-content">
          <h1>🚀 Claude Code Impact Analytics</h1>
          <p className="subtitle">
            Developer productivity since adoption on {new Date(productivity.claude_adoption_date).toLocaleDateString('pt-BR')}
          </p>
          <div className="days-using">
            <div className="days-value">{productivity.days_using_claude}</div>
            <div className="days-label">dias usando Claude Code</div>
          </div>
          <button 
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
            onClick={() => fetchProductivityData(true)}
            disabled={refreshing}
          >
            {refreshing ? '🔄 Atualizando...' : '🔄 Atualizar'}
          </button>
        </div>
      </header>

      {/* Hero Metrics */}
      <section className="hero-metrics">
        <div className="hero-card">
          <div className="hero-value" style={{ color: '#10B981' }}>
            {productivity.productivity_improvement.toFixed(1)}%
          </div>
          <div className="hero-label">Melhoria</div>
          <div className="hero-sublabel">Produtividade</div>
        </div>
        <div className="hero-card">
          <div className="hero-value" style={{ color: '#3B82F6' }}>
            {productivity.time_saved_hours}h
          </div>
          <div className="hero-label">Tempo</div>
          <div className="hero-sublabel">Economizado</div>
        </div>
        <div className="hero-card">
          <div className="hero-value" style={{ color: '#8B5CF6' }}>
            {productivity.efficiency_score.toFixed(2)}%
          </div>
          <div className="hero-label">Score</div>
          <div className="hero-sublabel">Eficiência</div>
        </div>
        <div className="hero-card">
          <div className="hero-value" style={{ color: '#F59E0B' }}>
            {productivity.after_claude_avg_hours}h
          </div>
          <div className="hero-label">Horas por Issue</div>
          <div className="hero-sublabel">era {productivity.before_claude_avg_hours}h</div>
        </div>
      </section>

      {/* Performance Charts Section */}
      <section className="performance-section">
        <div className="performance-charts">
          {/* Radar Chart */}
          <div className="chart-container">
            <h3>🎯 Performance Metrics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar 
                  name="Performance" 
                  dataKey="value" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Time Comparison Bar Chart */}
          <div className="chart-container">
            <h3>⏱️ Time Savings Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Monthly Evolution Line Chart */}
      <section className="evolution-section">
        <div className="evolution-container">
          <h2>📊 Monthly Evolution - Hours per Issue</h2>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={productivity.monthly_comparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
                formatter={(value: any) => [`${Number(value).toFixed(1)}h`, 'Hours per Issue']}
                labelFormatter={(label) => `Month: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="avg_hours_per_issue" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#7C3AED' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Achievements */}
      <section className="achievements-section">
        <div className="achievements-container">
          <h2>🏆 Achievements with Claude Code</h2>
          <div className="achievements-grid">
            {productivity.achievements.map((achievement, index) => (
              <div key={index} className="achievement-card">
                <span>✅</span>
                <span>{achievement}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Summary Section */}
      <section className="summary-section">
        <div className="summary-grid">
          <div className="summary-metric">
            <div className="summary-metric-value">
              {productivity.productivity_improvement.toFixed(0)}%
            </div>
            <div className="summary-metric-label">Overall Improvement</div>
          </div>
          <div className="summary-metric">
            <div className="summary-metric-value">
              {productivity.time_saved_hours}h
            </div>
            <div className="summary-metric-label">Time Saved</div>
          </div>
          <div className="summary-metric">
            <div className="summary-metric-value">
              {productivity.days_using_claude}
            </div>
            <div className="summary-metric-label">Days of Excellence</div>
          </div>
        </div>
        <div className="summary-description">
          <strong>Claude Code transformed development efficiency</strong>
          <br/>
          Reducing task complexity from {productivity.before_claude_avg_hours}h to {productivity.after_claude_avg_hours}h per issue
        </div>
      </section>
    </div>
  );
};

export default DeveloperProductivity;