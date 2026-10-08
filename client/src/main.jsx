import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './components/ui/theme-provider'
import { SocketProvider } from './contexts/socket-provider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SocketProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </SocketProvider>
    </BrowserRouter>
  </StrictMode>,
)
