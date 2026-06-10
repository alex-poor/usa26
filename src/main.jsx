import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import { KaroProvider } from './lib/karo.jsx'
import App from './components/App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <KaroProvider>
      <App />
    </KaroProvider>
  </React.StrictMode>
)
