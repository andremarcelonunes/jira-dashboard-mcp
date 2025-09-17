import { useState } from 'react'
import AgileDashboard from './components/AgileDashboard'
import ExecutiveDashboard from './components/ExecutiveDashboard'
import DeveloperProductivity from './components/DeveloperProductivity'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState<'agile' | 'executive' | 'productivity'>('agile')

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
            className={`nav-tab ${currentView === 'executive' ? 'active' : ''}`}
            onClick={() => setCurrentView('executive')}
          >
            Painel Executivo
          </button>
          <button 
            className={`nav-tab ${currentView === 'productivity' ? 'active' : ''}`}
            onClick={() => setCurrentView('productivity')}
          >
            🚀 Claude Code Impact
          </button>
        </div>
      </nav>
      
      <main className="app-main">
        {currentView === 'agile' ? <AgileDashboard /> : 
         currentView === 'executive' ? <ExecutiveDashboard /> : 
         <DeveloperProductivity />}
      </main>
    </div>
  )
}

export default App
