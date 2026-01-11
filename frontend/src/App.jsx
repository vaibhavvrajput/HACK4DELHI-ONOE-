import { Link, useNavigate } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WelcomePage from './pages/WelcomePage'
import VoterPage from './pages/VoterPage'
import AdminPage from './pages/AdminPage'
import { Routes, Route,  useLocation } from 'react-router-dom'

function App() {
  const navigate = useNavigate()
  // Add state for auth check
  const [role, setRole] = useState(localStorage.getItem('role'))

  const handleLogout = () => {
    localStorage.clear()
    navigate('/')
    window.location.reload()
  }

  // ECI Logo SVG Component
  const EciLogo = () => (
    <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="2"/>
      <path d="M50 5 L50 95 M5 50 L95 50" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      <circle cx="50" cy="50" r="15" fill="#FF9933"/>
      <path d="M50 20 L60 80 L40 80 Z" fill="#138808" opacity="0.8"/>
    </svg>
  )

  return (
    <div className="app-root">
      <header className="app-header">
        <Link to="/welcome" style={{ textDecoration: 'none' }}>
           <div className="eci-logo">
             <EciLogo />
             <div>
               <div style={{ fontSize: '1.2rem', lineHeight: '1' }}>ELECTION COMMISSION</div>
               <div style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 400 }}>OF INDIA</div>
             </div>
           </div>
        </Link>
        
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* Conditional Nav Items based on Role */}
          {role === 'admin' && (
             <Link to="/admin" style={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>Admin Portal</Link>
          )}
          {role === 'user' && (
             <Link to="/voter" style={{ color: 'white', textDecoration: 'none', opacity: 0.8 }}>Voter Dashboard</Link>
          )}
          
          {role ? (
            <button className="secondary" onClick={handleLogout} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
              Logout
            </button>
          ) : (
            <Link to="/" style={{ textDecoration: 'none' }}>
               <button className="primary" style={{ padding: '8px 20px' }}>Login</button>
            </Link>
          )}
        </nav>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <AnimateRoutes />
      </main>

      <footer style={{ 
        textAlign: 'center', 
        padding: '20px', 
        opacity: 0.4, 
        fontSize: '0.8rem',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        © 2026 Election Commission of India. All Rights Reserved. <br/>
        Secure Blockchain-Enabled Voting System
      </footer>
    </div>
  )
}

// Separate component for Routes to enable potential transitions later
const AnimateRoutes = () => {
  const location = useLocation()
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<LoginPage />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/voter" element={<VoterPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}

export default App
