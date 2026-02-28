import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { configureAmplify, validateAmplifyConfig } from './config/amplify.config'
import { networkMonitor } from './services/networkMonitor'
import { cacheService } from './services/cacheService'

// Initialize AWS Amplify
if (validateAmplifyConfig()) {
  configureAmplify()
} else {
  console.warn('⚠ Amplify configuration incomplete - authentication features may not work')
}

// Initialize cache service
cacheService.init().catch((error) => {
  console.error('Failed to initialize cache service:', error)
})

// Initialize network monitoring
networkMonitor.initialize()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
