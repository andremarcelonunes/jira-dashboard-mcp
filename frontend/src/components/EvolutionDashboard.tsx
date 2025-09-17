import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import './EvolutionDashboard.css';

interface EvolutionData {
  evolution_percentage: number;
  total_items: number;
  completed_items: number;
  in_progress_items: number;
  not_planned_items: number;
  impediments: number;
  dependencies: number;
  not_started: number;
  monthly_data: Array<{
    month: string;
    planned: number;
    completed: number;
  }>;
  observations: string;
  items_summary: Array<{
    area: string;
    activity: string;
    status: string;
    month: string;
    day: number;
  }>;
}

const EvolutionDashboard: React.FC = () => {
  const [data, setData] = useState<EvolutionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvolutionData();
  }, []);

  const fetchEvolutionData = async () => {
    try {
      const response = await fetch('http://localhost:8089/api/evolution-data');
      const evolutionData = await response.json();
      setData(evolutionData);
    } catch (error) {
      console.error('Error fetching evolution data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!data) {
    return <div className="error">Error loading evolution data</div>;
  }

  const pieData = [
    { name: 'Concluídos', value: data.completed_items, fill: '#34a853' },
    { name: 'Em Progresso', value: data.in_progress_items, fill: '#4285f4' },
    { name: 'Dependência', value: data.dependencies, fill: '#ff9800' },
    { name: 'Não Iniciados', value: data.not_started, fill: '#9e9e9e' },
    { name: 'Atrasados', value: data.not_planned_items, fill: '#dc3545' }
  ];

  return (
    <div className="evolution-dashboard">
      <header className="dashboard-header">
        <h1>Evolução Matcon 2025</h1>
        <div className="filters">
          <select className="filter-select">
            <option>Áreas Envolvidas - Todos</option>
          </select>
          <select className="filter-select">
            <option>Status - Todos</option>
          </select>
          <select className="filter-select">
            <option>Criticidade - Todos</option>
          </select>
        </div>
      </header>

      <div className="evolution-grid">
        <div className="metric-cards">
          <div className="metric-card">
            <div className="metric-icon">%</div>
            <div className="metric-content">
              <h3>Evolução</h3>
              <div className="metric-value">{data.evolution_percentage}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <h3>Totais de Itens</h3>
              <div className="metric-value">{data.total_items}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">✅</div>
            <div className="metric-content">
              <h3>Itens concluídos</h3>
              <div className="metric-value">{data.completed_items}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🔄</div>
            <div className="metric-content">
              <h3>Itens progresso</h3>
              <div className="metric-value">{data.in_progress_items}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📋</div>
            <div className="metric-content">
              <h3>Total itens NP</h3>
              <div className="metric-value">{data.not_planned_items}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⚠️</div>
            <div className="metric-content">
              <h3>Impedimentos</h3>
              <div className="metric-value">{data.impediments}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">🔗</div>
            <div className="metric-content">
              <h3>Dependência</h3>
              <div className="metric-value">{data.dependencies}</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⏸️</div>
            <div className="metric-content">
              <h3>Itens não iniciados</h3>
              <div className="metric-value">{data.not_started}</div>
            </div>
          </div>
        </div>

        <div className="chart-section">
          <div className="chart-card large">
            <h3>Evolução dos Itens</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {pieData.map((entry, index) => (
                <div key={index} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: entry.fill }}></div>
                  <span>{entry.name}</span>
                  <span>{entry.value} ({((entry.value / data.total_items) * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card large">
            <h3>Total de Itens planejados x concluídos por mês</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.monthly_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="planned" fill="#4285f4" name="Totais_Itens" />
                <Bar dataKey="completed" fill="#34a853" name="Itens_Concluídos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="observations-section">
          <div className="observations-card">
            <h3>Observações Gerais</h3>
            <p>{data.observations}</p>
          </div>

          <div className="items-summary-card">
            <h3>Resumo dos Itens</h3>
            <div className="items-table">
              <div className="table-header">
                <div>Áreas Envolvidas</div>
                <div>Atividade</div>
                <div>Status</div>
                <div>Mês</div>
                <div>Dia</div>
              </div>
              {data.items_summary.map((item, index) => (
                <div key={index} className="table-row">
                  <div>{item.area}</div>
                  <div>{item.activity}</div>
                  <div className={`status ${item.status.toLowerCase().replace(' ', '-')}`}>
                    {item.status}
                  </div>
                  <div>{item.month}</div>
                  <div>{item.day}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvolutionDashboard;