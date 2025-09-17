import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getPreloadedAgileData } from '../utils/preloadCache';
import './AgileDashboard.css';

interface EffortMetrics {
  total_estimated_hours: number;
  completed_hours: number;
  remaining_hours: number;
  current_avg_hours_per_issue: number;
  effort_evolution: Array<{
    month: string;
    avg_hours_per_issue: number;
    completed_hours: number;
  }>;
  productivity_trend: string;
  estimated_completion_date: string;
  burn_rate_hours_per_week: number;
}

interface AgileMetrics {
  velocity: number;
  bugs_prod: number;
  bugs_qa: number;
  unplanned: number;
  committed_vs_delivered: {
    committed: number;
    delivered: number;
  };
  quality_percentage: number;
  team_health: number;
  lead_time: number;
  cycle_time_evolution?: Array<{
    month: string;
    cycle_time: number;
    issue_count: number;
  }>;
  cycle_time_stats?: {
    average: number;
    median: number;
    p90: number;
    min: number;
    max: number;
    count: number;
  };
  data_source?: string;
  total_issues?: number;
  fetched_at?: string;
  breakdown?: {
    done: number;
    testing: number;
    backlog: number;
    bugs: number;
    subtasks: number;
    high_priority: number;
  };
  effort_metrics?: EffortMetrics;
}

const AgileDashboard: React.FC = () => {
  // ULTRA-AGGRESSIVE: Try to get data IMMEDIATELY during component initialization
  const initialData = getPreloadedAgileData();
  const [metrics, setMetrics] = useState<AgileMetrics | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);
  
  // Log instant availability
  if (initialData) {
    console.log('⚡ ZERO-DELAY: Agile data available at component mount');
  }

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      // First, try to get any immediately available data
      let preloadedData = getPreloadedAgileData();
      
      if (preloadedData && mounted) {
        setMetrics(preloadedData);
        setLoading(false);
        console.log('⚡ INSTANT display from preloaded cache');
      } else {
        // If no immediate data, wait a moment for preload to complete
        setTimeout(() => {
          if (mounted) {
            preloadedData = getPreloadedAgileData();
            if (preloadedData) {
              setMetrics(preloadedData);
              setLoading(false);
              console.log('⚡ DELAYED display from preloaded cache');
            } else {
              // Last resort: fetch directly
              fetchAgileMetrics(false, true);
            }
          }
        }, 100);
      }
      
      // Start background refresh cycle
      const interval = setInterval(() => {
        if (mounted) {
          fetchAgileMetrics(false, false);
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

  const fetchAgileMetrics = async (forceRefresh = false, isInitialLoad = false) => {
    try {
      // Set loading states
      if (isInitialLoad && !metrics) {
        setLoading(true);
      } else if (forceRefresh) {
        setRefreshing(true);
      }
      
      const url = forceRefresh 
        ? `http://localhost:8089/api/agile-metrics?_t=${Date.now()}`
        : 'http://localhost:8089/api/agile-metrics';
      
      const startTime = Date.now();
      const response = await fetch(url);
      const data = await response.json();
      const loadTime = Date.now() - startTime;
      
      // Update metrics immediately
      setMetrics(data);
      
      // Log performance
      if (data._cache_served) {
        console.log(`⚡ Cache served in ${loadTime}ms`);
      } else {
        console.log(`📡 Fresh data in ${loadTime}ms`);
      }
      
    } catch (error) {
      console.error('Error fetching agile metrics:', error);
    } finally {
      // ALWAYS stop loading states after request completes
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    fetchAgileMetrics(true); // Force refresh
  };

  if (loading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div className="spinner" style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 2s linear infinite',
          marginBottom: '20px'
        }}></div>
        <div style={{ color: '#666', fontSize: '18px' }}>
          Carregando dados do Jira...
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!metrics) {
    return <div className="error">Error loading metrics</div>;
  }

  const commitmentData = [
    {
      name: 'Comprometido vs Entregue',
      committed: metrics.committed_vs_delivered.committed,
      delivered: metrics.committed_vs_delivered.delivered,
    },
  ];

  const teamHealthData = [
    { name: 'Healthy', value: metrics.team_health, fill: '#4285f4' },
    { name: 'Unhealthy', value: 100 - metrics.team_health, fill: '#f4f4f4' },
  ];

  const qualityData = [
    { name: 'Quality Issues', value: metrics.quality_percentage, fill: '#dc3545' },
    { name: 'Good Quality', value: 100 - metrics.quality_percentage, fill: '#f4f4f4' },
  ];

  const effortData = metrics.effort_metrics?.effort_evolution || [];
  
  // Create progress data for clearer display
  const effortProgress = metrics.effort_metrics ? {
    completed: metrics.effort_metrics.completed_hours,
    total: metrics.effort_metrics.completed_hours + metrics.effort_metrics.remaining_hours,
    percentage: Math.round((metrics.effort_metrics.completed_hours / (metrics.effort_metrics.completed_hours + metrics.effort_metrics.remaining_hours)) * 100)
  } : null;

  return (
    <div className="agile-dashboard">
      <header className="dashboard-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Painel Ágil - Projeto CB {refreshing && <span style={{fontSize: '16px', marginLeft: '10px'}}>🔄 Atualizando...</span>}</h1>
            <p className="data-source-indicator">
              {metrics.data_source === 'live_jira' || metrics.data_source === 'comprehensive_analysis' || metrics.data_source === 'live_mcp_api' ? '📊 Dados em Tempo Real do Jira' : '⚠️ Dados de Fallback'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button 
              onClick={handleManualRefresh}
              disabled={refreshing}
              style={{
                padding: '8px 16px',
                backgroundColor: refreshing ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                marginBottom: '4px'
              }}
            >
              {refreshing ? '🔄 Atualizando...' : '🔄 Atualizar Agora'}
            </button>
            <small style={{ color: '#666', fontSize: '12px' }}>
              Última atualização: {metrics.fetched_at ? new Date(metrics.fetched_at).toLocaleTimeString('pt-BR') : 'N/A'}
            </small>
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="metric-card">
          <h3>Projeto</h3>
          <div className="project-info">CB</div>
        </div>

        <div className="metric-card">
          <h3>Issues Analisadas</h3>
          <div className="total-issues">{metrics.total_issues}</div>
        </div>

        <div className="metric-card">
          <h3>Velocity</h3>
          <div className="velocity-value">{metrics.velocity}</div>
        </div>

        <div className="metric-card">
          <h3>Bugs de PROD</h3>
          <div className="bugs-value">{metrics.bugs_prod}</div>
        </div>

        <div className="metric-card">
          <h3>Bugs de QA</h3>
          <div className="bugs-value">{metrics.bugs_qa}</div>
        </div>

        <div className="metric-card">
          <h3>Não Planejadas</h3>
          <div className="unplanned-value">{metrics.unplanned}</div>
        </div>

        <div className="metric-card">
          <h3>Horas Completadas</h3>
          <div className="effort-value">{metrics.effort_metrics?.completed_hours.toLocaleString() || 0}h</div>
        </div>

        <div className="metric-card">
          <h3>Média h/Issue</h3>
          <div className="avg-hours-value">{metrics.effort_metrics?.current_avg_hours_per_issue || 0}h</div>
        </div>

        <div className="chart-card">
          <h3>Comprometido x Entregue (Pts)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={commitmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="committed" fill="#4285f4" name="Soma de Comprometido (Pts)" />
              <Bar dataKey="delivered" fill="#34a853" name="Soma de Entregue (Pts)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Qualidade (% bugs)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={qualityData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
              >
                {qualityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="quality-percentage">{metrics.quality_percentage}%</div>
        </div>

        <div className="chart-card">
          <h3>Cycle Time (dias)</h3>
          <div className="cycle-time-summary">
            {metrics.cycle_time_stats ? (
              <div className="cycle-time-detailed">
                <div className="cycle-time-main">
                  <span className="cycle-time-label">Média:</span>
                  <span className="cycle-time-value">{metrics.cycle_time_stats.average} dias</span>
                  <span className="cycle-time-count">({metrics.cycle_time_stats.count} issues)</span>
                </div>
                <div className="cycle-time-stats">
                  <div className="stat-item">
                    <span className="stat-label">Mediana:</span>
                    <span className="stat-value">{metrics.cycle_time_stats.median}d</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">90% em:</span>
                    <span className="stat-value">{metrics.cycle_time_stats.p90}d</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Min-Max:</span>
                    <span className="stat-value">{metrics.cycle_time_stats.min}-{metrics.cycle_time_stats.max}d</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="current-cycle-time">
                <span className="cycle-time-label">Atual:</span>
                <span className="cycle-time-value">{metrics.lead_time} dias</span>
              </div>
            )}
          </div>
          {metrics.cycle_time_evolution && (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metrics.cycle_time_evolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name, props) => {
                  if (name === 'cycle_time') {
                    const issueCount = props?.payload?.issue_count || 0;
                    return [`${value} dias (${issueCount} issues)`, 'Cycle Time'];
                  }
                  return [value, name];
                }} />
                <Line 
                  type="monotone" 
                  dataKey="cycle_time" 
                  stroke="#ff6b35" 
                  strokeWidth={3}
                  dot={{ fill: '#ff6b35', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Saúde do time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={teamHealthData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                dataKey="value"
              >
                {teamHealthData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="team-health-value">{metrics.team_health}</div>
        </div>

        <div className="chart-card">
          <h3>Evolução do Esforço (h/issue)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={effortData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value, name) => [`${value}h`, name === 'avg_hours_per_issue' ? 'Média h/issue' : 'Total']} />
              <Bar dataKey="avg_hours_per_issue" fill="#ff9500" name="Média h/issue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Progresso do Esforço (Horas)</h3>
          {effortProgress ? (
            <div className="effort-progress-container">
              <div className="progress-summary">
                <div className="progress-stats">
                  <div className="stat-item">
                    <span className="stat-label">Horas Completadas:</span>
                    <span className="stat-value completed">{effortProgress.completed.toLocaleString()}h</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Estimado:</span>
                    <span className="stat-value total">{effortProgress.total.toLocaleString()}h</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Progresso:</span>
                    <span className="stat-value progress">{effortProgress.percentage}%</span>
                  </div>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${effortProgress.percentage}%` }}
                    ></div>
                  </div>
                  <div className="progress-labels">
                    <span>0h</span>
                    <span>{effortProgress.total.toLocaleString()}h</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={[
                  { name: 'Completado', value: effortProgress.completed, fill: '#34a853' },
                  { name: 'Restante', value: effortProgress.total - effortProgress.completed, fill: '#fbbc04' }
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value.toLocaleString()}h`, 'Horas']} />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="no-data">Dados de esforço não disponíveis</div>
          )}
        </div>

        <div className="observations-card">
          <h3>Observações</h3>
          <div className="observations-content">
            <div className="observation-item">
              <span className="observation-label">Issues Analisadas:</span>
              <span className="observation-value">{metrics.total_issues}</span>
            </div>
            <div className="observation-item">
              <span className="observation-label">Fonte dos Dados:</span>
              <span className="observation-value">{metrics.data_source === 'live_jira' || metrics.data_source === 'comprehensive_analysis' || metrics.data_source === 'live_mcp_api' ? `Jira Tempo Real (${metrics.total_issues} issues)` : 'Dados de Fallback'}</span>
            </div>
            <div className="observation-item">
              <span className="observation-label">Última Atualização:</span>
              <span className="observation-value">{metrics.fetched_at ? new Date(metrics.fetched_at).toLocaleDateString('pt-BR') : 'N/A'}</span>
            </div>
            {metrics.effort_metrics && (
              <>
                <div className="observation-item">
                  <span className="observation-label">Tendência Produtividade:</span>
                  <span className="observation-value">{metrics.effort_metrics.productivity_trend === 'improving' ? '📈 Melhorando' : '📉 Degradando'}</span>
                </div>
                <div className="observation-item">
                  <span className="observation-label">Burn Rate Semanal:</span>
                  <span className="observation-value">{metrics.effort_metrics.burn_rate_hours_per_week}h/semana</span>
                </div>
                <div className="observation-item">
                  <span className="observation-label">Previsão Conclusão:</span>
                  <span className="observation-value">{new Date(metrics.effort_metrics.estimated_completion_date).toLocaleDateString('pt-BR')}</span>
                </div>
              </>
            )}
            {metrics.cycle_time_stats && (
              <div className="observation-item">
                <span className="observation-label">Cycle Time Mediano:</span>
                <span className="observation-value">{metrics.cycle_time_stats.median} dias (de {metrics.cycle_time_stats.count} issues)</span>
              </div>
            )}
            <div className="observation-item">
              <span className="observation-label">Saúde Combinada:</span>
              <span className="observation-value">
                {metrics.team_health >= 70 ? '🟢 Excelente' : 
                 metrics.team_health >= 50 ? '🟡 Boa' : 
                 metrics.team_health >= 30 ? '🟠 Regular' : '🔴 Crítica'} ({metrics.team_health}%)
              </span>
            </div>
            <div className="observation-item">
              <span className="observation-label">Taxa de Conclusão:</span>
              <span className="observation-value">{Math.round((metrics.velocity / (metrics.total_issues || 1)) * 100)}% do projeto concluído</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgileDashboard;