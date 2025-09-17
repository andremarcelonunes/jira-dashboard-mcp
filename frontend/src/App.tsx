import { useState } from 'react'
import AgileDashboard from './components/AgileDashboard'
import EvolutionDashboard from './components/EvolutionDashboard'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState<'agile' | 'evolution'>('agile')

  return (
    <div className="app">
      <nav className="app-nav">
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${currentView === 'agile' ? 'active' : ''}`}
            onClick={() => setCurrentView('agile')}
          >
            Painel Ágil
          </button>
          <button 
            className={`nav-tab ${currentView === 'evolution' ? 'active' : ''}`}
            onClick={() => setCurrentView('evolution')}
          >
            Evolução Matcon 2025
          </button>
        </div>
      </nav>
      
      <main className="app-main">
        {currentView === 'agile' ? <AgileDashboard /> : <EvolutionDashboard />}
      </main>
    </div>
  )
}

export default App
