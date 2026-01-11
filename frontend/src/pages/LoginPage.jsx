import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const LoginPage = () => {
  const [voterId, setVoterId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter_id: voterId, password })
      })
      if (!res.ok) throw new Error('Invalid voter ID or password')
      const data = await res.json()
      const { token, role, state } = data
      if (role === 'admin') localStorage.setItem('jwtTokenAdmin', token)
      if (role === 'user') localStorage.setItem('jwtTokenVoter', token)
      localStorage.setItem('voter_id', voterId)
      localStorage.setItem('role', role)
      // Save the state returned from backend
      localStorage.setItem('userState', state)
      
      // Force a small reload/redirect to ensure App.jsx picks up the role
      window.location.href = role === 'admin' ? '/admin' : '/voter'
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-in" style={{ width: '100%', maxWidth: '400px', margin: '40px auto' }}>
      <div className="card glass text-center">
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            background: 'linear-gradient(135deg, var(--saffron), #ffcc80)',
            borderRadius: '50%',
            margin: '0 auto 15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(255, 153, 51, 0.4)'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <h2>Voter Portal</h2>
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
            Secure Unified Access
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label htmlFor="voter-id" style={{ fontSize: '0.85rem', fontWeight: 600, marginLeft: '4px' }}>Voter ID / Admin ID</label>
            <input
              id="voter-id"
              type="text"
              value={voterId}
              onChange={(e) => setVoterId(e.target.value)}
              required
              placeholder="e.g. V12345"
              className="glass-input"
              style={{ padding: '12px' }}
            />
          </div>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label htmlFor="password" style={{ fontSize: '0.85rem', fontWeight: 600, marginLeft: '4px' }}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="glass-input"
              style={{ padding: '12px' }}
            />
          </div>

          {error && (
            <div style={{ 
              background: 'rgba(255,0,0,0.1)', 
              color: '#ff6b6b', 
              padding: '10px', 
              borderRadius: '8px', 
              fontSize: '0.85rem',
              border: '1px solid rgba(255,0,0,0.2)'
            }}>{error}</div>
          )}
          
          <button className="primary" type="submit" disabled={loading} style={{ marginTop: '10px', padding: '12px' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="spinner"></span> Verifying...
              </span>
            ) : 'Secure Login'}
          </button>

          {/* New Register Link */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-400 text-sm mb-3">New Voter?</p>
            <Link 
              to="/register"
              className="block w-full bg-white/5 hover:bg-white/10 text-emerald-400 font-semibold py-2 px-4 rounded-lg transition-colors border border-dashed border-emerald-500/30"
            >
              Register with Aadhar
            </Link>
          </div>

        </form>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem', opacity: 0.6 }}>
        <p>Protected by 256-bit Encryption & Blockchain Verification</p>
      </div>
    </div>
  )
}

export default LoginPage
