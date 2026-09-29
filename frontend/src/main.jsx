import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/AppShell'
import UpdatePrompt from './components/UpdatePrompt'
import './index.css'

// IMPORTAMOS O PROVEDOR DE AUTENTICAÇÃO
import { AuthProvider } from './context/AuthContext'
import { AppSettingsProvider } from './context/AppSettingsContext'
// GAMIFICAÇÃO GLOBAL — XP, badges, streak, toasts
import { GamificationProvider } from './context/GamificationContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppSettingsProvider>
        <AuthProvider>
          <GamificationProvider>
            <UpdatePrompt />
            <App />
          </GamificationProvider>
        </AuthProvider>
      </AppSettingsProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
