import { useState } from 'react'
import AgileDashboard from './components/AgileDashboard'
import ExecutiveDashboard from './components/ExecutiveDashboard'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState<'agile' | 'executive'>('agile')

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
        </div>
      </nav>
      
      <main className="app-main">
        {currentView === 'agile' ? <AgileDashboard /> : <ExecutiveDashboard />}
      </main>
    </div>
  )
}

export default App
