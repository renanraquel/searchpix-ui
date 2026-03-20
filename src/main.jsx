import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
/* Connect Plus (Bootstrap + tema admin) */
import '../connect-plus-1.0.0/assets/vendors/mdi/css/materialdesignicons.min.css'
import '../connect-plus-1.0.0/assets/vendors/css/vendor.bundle.base.css'
import '../connect-plus-1.0.0/assets/css/style.css'
import './styles/connect-plus-overrides.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
