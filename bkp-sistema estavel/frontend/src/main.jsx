import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './app/AppShell' // Ou './App.jsx' dependendo de como está o nome do seu arquivo
import './index.css'

// IMPORTAMOS O PROVEDOR DE AUTENTICAÇÃO
import { AuthProvider } from './context/AuthContext' 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      
      {/* ENVOLVEMOS O APP AQUI */}
      <AuthProvider>
        <App />
      </AuthProvider>

    </BrowserRouter>
  </React.StrictMode>,
)