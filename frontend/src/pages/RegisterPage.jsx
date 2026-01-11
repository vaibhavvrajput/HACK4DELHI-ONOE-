import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const RegisterPage = () => {
    const [step, setStep] = useState(1) // 1: Aadhar, 2: Success
    const [aadhar, setAadhar] = useState('')
    const [pan, setPan] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [creds, setCreds] = useState({ voter_id: '', password: '', state: '' })
    const navigate = useNavigate()

    const handleVerifyAndRegister = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Call Python Backend
            const response = await fetch('http://127.0.0.1:8000/register-new-voter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    aadhar_number: aadhar,
                    pan_number: pan.toUpperCase()
                })
            })
            
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || 'Registration failed')
            }

            setCreds({ voter_id: data.voter_id, password: data.password, state: data.state })
            setStep(2)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-box glass-effect">
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-green-500">
                        New Voter Registration
                    </h2>
                    <p className="text-gray-400 text-sm mt-2">Official Portal of India</p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.form 
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleVerifyAndRegister}
                        >
                            <div className="mb-6">
                                <label className="block text-gray-300 text-sm font-medium mb-1">Aadhar Number</label>
                                <input
                                    type="text"
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    placeholder="XXXX XXXX XXXX"
                                    maxLength="12"
                                    value={aadhar}
                                    onChange={(e) => setAadhar(e.target.value.replace(/\D/g, ''))}
                                />
                                <p className="text-xs text-gray-500 mt-1">Enter your 12-digit UIDAI number</p>
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-300 text-sm font-medium mb-1">PAN Number</label>
                                <input
                                    type="text"
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all uppercase"
                                    placeholder="ABCDE1234F"
                                    maxLength="10"
                                    value={pan}
                                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                                />
                                <p className="text-xs text-gray-500 mt-1">Mandatory for identity verification</p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-2 rounded mb-4 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || aadhar.length !== 12 || pan.length !== 10}
                                className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Verifying...' : 'Verify & Register'}
                            </button>
                            
                            <div className="mt-4 text-center">
                                <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm">
                                    Already have a Voter ID? Login here
                                </Link>
                            </div>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-green-900/40 border border-green-500/30 rounded-xl p-6 text-center"
                        >
                            <div className="text-5xl mb-4">✅</div>
                            <h3 className="text-xl font-bold text-white mb-2">Registration Successful!</h3>
                            <p className="text-gray-300 text-sm mb-6">Please save these credentials safely.</p>
                            
                            <div className="bg-black/30 p-4 rounded-lg text-left mb-6">
                                <div className="mb-3">
                                    <span className="text-gray-400 text-xs uppercase tracking-wider">Voter ID</span>
                                    <div className="text-lg font-mono text-white select-all">{creds.voter_id}</div>
                                </div>
                                <div className="mb-3">
                                    <span className="text-gray-400 text-xs uppercase tracking-wider">Password</span>
                                    <div className="text-lg font-mono text-white select-all">{creds.password}</div>
                                </div>
                                <div>
                                    <span className="text-gray-400 text-xs uppercase tracking-wider">Assigned State</span>
                                    <div className="text-lg font-mono text-yellow-400">{creds.state}</div>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                            >
                                Proceed to Login
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default RegisterPage
