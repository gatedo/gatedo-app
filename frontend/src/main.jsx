import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/AppShell' 
import './index.css'

// IMPORTAMOS O PROVEDOR DE AUTENTICAÇÃO
import { AuthProvider } from './context/AuthContext'
// GAMIFICAÇÃO GLOBAL — XP, badges, streak, toasts
import { GamificationProvider } from './context/GamificationContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <GamificationProvider>
          <App />
        </GamificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)