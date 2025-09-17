import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { getPreloadedExecutiveData } from '../utils/preloadCache';
import './ExecutiveDashboard.css';

interface ExecutiveMetrics {
  business_value_score: number;
  customer_satisfaction_indicator: string;
  delivery_performance: number;
  quality_excellence: number;
  velocity_trend: string;
  predictability_score: number;
  efficiency_rating: number;
  innovation_index: number;
  achievements: string[];
  success_metrics: {
    issues_delivered: number;
    completion_rate: string;
    quality_score: string;
    team_health: string;
    velocity: number;
    cycle_time: string;
  };
  performance_trends: {
    delivery: string;
    quality: string;
    velocity: string;
    team_health: string;
  };
  competitive_advantages: string[];
  monthly_performance: Array<{
    month: string;
    delivery_score: number;
    quality_score: number;
    issues_completed: number;
  }>;
  success_indicators: {
    delivery_performance: number;
    quality_excellence: number;
    team_performance: number;
    business_value: number;
  };
  fetched_at?: string;
  period: string;
}

const ExecutiveDashboard: React.FC = () => {
  // ULTRA-AGGRESSIVE: Try to get data IMMEDIATELY during component initialization
  const initialData = getPreloadedExecutiveData();
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);
  
  // Log instant availability
  if (initialData) {
    console.log('⚡ ZERO-DELAY: Executive data available at component mount');
  }

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      // First, try to get any immediately available data
      let preloadedData = getPreloadedExecutiveData();
      
      if (preloadedData && mounted) {
        setMetrics(preloadedData);
        setLoading(false);
        console.log('⚡ INSTANT executive display from preloaded cache');
      } else {
        // If no immediate data, wait a moment for preload to complete
        setTimeout(() => {
          if (mounted) {
            preloadedData = getPreloadedExecutiveData();
            if (preloadedData) {
              setMetrics(preloadedData);
              setLoading(false);
              console.log('⚡ DELAYED executive display from preloaded cache');
            } else {
              // Last resort: fetch directly
              fetchExecutiveMetrics(false, true);
            }
          }
        }, 100);
      }
      
      // Start background refresh cycle
      const interval = setInterval(() => {
        if (mounted) {
          fetchExecutiveMetrics(false, false);
        }
      }, 30000);
      
      return () => {
        mounted = false;
        clearInterval(interval);
      };
    };
    
    const cleanup = loadData();
    
    return () => {
      mounted = false;
      cleanup.then(cleanupFn => cleanupFn && cleanupFn());
    };
  }, []);

  const fetchExecutiveMetrics = async (forceRefresh = false, isInitialLoad = false) => {
    try {
      // Set loading states
      if (isInitialLoad && !metrics) {
        setLoading(true);
      } else if (forceRefresh) {
        setRefreshing(true);
      }
      
      const url = forceRefresh 
        ? `http://localhost:8089/api/executive-metrics?_t=${Date.now()}`
        : 'http://localhost:8089/api/executive-metrics';
      
      const startTime = Date.now();
      const response = await fetch(url);
      const data = await response.json();
      const loadTime = Date.now() - startTime;
      
      // Update metrics immediately
      setMetrics(data);
      
      // Log performance
      if (data._cache_served) {
        console.log(`⚡ Executive cache served in ${loadTime}ms`);
      } else {
        console.log(`📡 Executive fresh data in ${loadTime}ms`);
      }
      
    } catch (error) {
      console.error('Error fetching executive metrics:', error);
    } finally {
      // ALWAYS stop loading states after request completes
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#10B981'; // Green
    if (score >= 70) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getTrendColor = (trend: string) => {
    const goodTrends = ['Improving', 'Excellent', 'Strong', 'On Track'];
    const okTrends = ['Stable', 'Good'];
    
    if (goodTrends.includes(trend)) return '#10B981';
    if (okTrends.includes(trend)) return '#F59E0B';
    return '#EF4444';
  };

  if (loading) {
    return (
      <div className="executive-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando métricas executivas...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="executive-dashboard">
        <div className="error-container">
          <p>Erro ao carregar métricas executivas</p>
        </div>
      </div>
    );
  }

  // Transform data for radar chart
  const radarData = [
    { metric: 'Entrega', value: metrics.delivery_performance, fullMark: 100 },
    { metric: 'Qualidade', value: metrics.quality_excellence, fullMark: 100 },
    { metric: 'Eficiência', value: metrics.efficiency_rating, fullMark: 100 },
    { metric: 'Inovação', value: metrics.innovation_index, fullMark: 100 },
    { metric: 'Previsibilidade', value: metrics.predictability_score, fullMark: 100 }
  ];

  return (
    <div className="executive-dashboard">
      <header className="executive-header">
        <div className="header-content">
          <h1>Painel Executivo</h1>
          <p className="subtitle">{metrics.period}</p>
          <button 
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
            onClick={() => fetchExecutiveMetrics(true)}
            disabled={refreshing}
          >
            {refreshing ? '🔄 Atualizando...' : '🔄 Atualizar'}
          </button>
        </div>
        {metrics.fetched_at && (
          <p className="last-update">
            Última atualização: {new Date(metrics.fetched_at).toLocaleString('pt-BR')}
          </p>
        )}
      </header>

      {/* Hero Metrics */}
      <section className="hero-metrics">
        <div className="hero-card">
          <div className="hero-value" style={{ color: getScoreColor(metrics.business_value_score) }}>
            {metrics.business_value_score.toFixed(1)}
          </div>
          <div className="hero-label">Valor de Negócio</div>
          <div className="hero-sublabel">Score Geral</div>
        </div>
        <div className="hero-card">
          <div className="hero-value" style={{ color: '#10B981' }}>
            {metrics.customer_satisfaction_indicator}
          </div>
          <div className="hero-label">Satisfação</div>
          <div className="hero-sublabel">Cliente</div>
        </div>
        <div className="hero-card">
          <div className="hero-value" style={{ color: getScoreColor(metrics.delivery_performance) }}>
            {metrics.delivery_performance.toFixed(1)}%
          </div>
          <div className="hero-label">Performance</div>
          <div className="hero-sublabel">Entrega</div>
        </div>
        <div className="hero-card">
          <div className="hero-value" style={{ color: getScoreColor(metrics.quality_excellence) }}>
            {metrics.quality_excellence.toFixed(1)}%
          </div>
          <div className="hero-label">Excelência</div>
          <div className="hero-sublabel">Qualidade</div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="success-section">
        <h2>🏆 Conquistas do Período</h2>
        <div className="achievements-grid">
          {metrics.achievements.map((achievement, index) => (
            <div key={index} className="achievement-card">
              {achievement}
            </div>
          ))}
        </div>
      </section>

      {/* Performance Overview */}
      <section className="performance-section">
        <div className="performance-charts">
          {/* Team Performance Radar */}
          <div className="chart-container">
            <h3>Performance da Equipe</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar 
                  name="Performance" 
                  dataKey="value" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Trends */}
          <div className="chart-container">
            <h3>Tendência Mensal</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.monthly_performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="delivery_score" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  name="Score de Entrega"
                />
                <Line 
                  type="monotone" 
                  dataKey="quality_score" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  name="Score de Qualidade"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Key Metrics Summary */}
      <section className="metrics-summary">
        <h2>📊 Indicadores Chave</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">{metrics.success_metrics.issues_delivered}</div>
            <div className="metric-label">Issues Entregues</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.success_metrics.completion_rate}</div>
            <div className="metric-label">Taxa de Conclusão</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.success_metrics.quality_score}</div>
            <div className="metric-label">Score de Qualidade</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.success_metrics.velocity}</div>
            <div className="metric-label">Velocidade</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.success_metrics.cycle_time}</div>
            <div className="metric-label">Tempo de Ciclo</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.success_metrics.team_health}</div>
            <div className="metric-label">Saúde da Equipe</div>
          </div>
        </div>
      </section>

      {/* Performance Trends */}
      <section className="trends-section">
        <h2>📈 Tendências de Performance</h2>
        <div className="trends-grid">
          <div className="trend-card">
            <div className="trend-label">Entrega</div>
            <div className="trend-value" style={{ color: getTrendColor(metrics.performance_trends.delivery) }}>
              {metrics.performance_trends.delivery}
            </div>
          </div>
          <div className="trend-card">
            <div className="trend-label">Qualidade</div>
            <div className="trend-value" style={{ color: getTrendColor(metrics.performance_trends.quality) }}>
              {metrics.performance_trends.quality}
            </div>
          </div>
          <div className="trend-card">
            <div className="trend-label">Velocidade</div>
            <div className="trend-value" style={{ color: getTrendColor(metrics.performance_trends.velocity) }}>
              {metrics.performance_trends.velocity}
            </div>
          </div>
          <div className="trend-card">
            <div className="trend-label">Saúde da Equipe</div>
            <div className="trend-value" style={{ color: getTrendColor(metrics.performance_trends.team_health) }}>
              {metrics.performance_trends.team_health}
            </div>
          </div>
        </div>
      </section>

      {/* Competitive Advantages */}
      <section className="advantages-section">
        <h2>🚀 Vantagens Competitivas</h2>
        <div className="advantages-list">
          {metrics.competitive_advantages.map((advantage, index) => (
            <div key={index} className="advantage-item">
              <span className="advantage-icon">✓</span>
              {advantage}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ExecutiveDashboard;