import React, { useEffect, useState } from 'react'
import { getVotingContract } from '../eth/voting'

const AdminPage = () => {
  const [name, setName] = useState('')
  const [party, setParty] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [dates, setDates] = useState('')
  const [info, setInfo] = useState('')
  
  // Tabs: 'candidates' | 'settings' | 'security'
  const [activeTab, setActiveTab] = useState('candidates')

  useEffect(() => {
    const init = async () => {
      try {
        const { contract } = await getVotingContract()
        const [start, end] = await contract.methods.getDates().call()
        if (Number(start) && Number(end)) {
          const s = new Date(Number(start) * 1000)
          const e = new Date(Number(end) * 1000)
          setDates(`${s.toDateString()} - ${e.toDateString()}`)
        }
      } catch (e) {
        console.error(e)
      }
    }
    init()
  }, [])

  const handleAddCandidate = async () => {
    if (!name || !party) {
      setInfo('Name and Party are required.')
      return
    }
    try {
      const { contract, account } = await getVotingContract()
      await contract.methods.addCandidate(name, party).send({ from: account })
      setInfo(`✓ Candidate "${name}" added successfully.`)
      setName('')
      setParty('')
    } catch (e) {
      console.error(e)
      setInfo('Failed to add candidate.')
    }
  }

  const handleSetDates = async () => {
    if (!startDate || !endDate) {
      setInfo('Start and End dates are required.')
      return
    }
    const s = Math.floor(new Date(startDate).getTime() / 1000)
    const e = Math.floor(new Date(endDate).getTime() / 1000)
    try {
      const { contract, account } = await getVotingContract()
      await contract.methods.setDates(s, e).send({ from: account })
      setInfo('✓ Voting schedule updated.')
      const sDate = new Date(s * 1000)
      const eDate = new Date(e * 1000)
      setDates(`${sDate.toDateString()} - ${eDate.toDateString()}`)
    } catch (e2) {
      console.error(e2)
      setInfo('Failed to set dates.')
    }
  }

  return (
    <div className="animate-in" style={{ width: '100%', maxWidth: '1000px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, background: 'linear-gradient(to right, #ffffff, #b3b3b3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Admin Control Center
        </h1>
        <div style={{ fontSize: '0.9rem', opacity: 0.6, background: 'rgba(255,255,255,0.05)', padding: '5px 10px', borderRadius: '4px' }}>
          Mode: Secure Admin
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '30px' }}>
        {[
          { id: 'candidates', label: 'Candidate Management' },
          { id: 'settings', label: 'Election Schedule' },
          { id: 'security', label: 'Security & Integrity' }
        ].map(tab => (
          <div 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              padding: '12px 20px', 
              cursor: 'pointer',
              color: activeTab === tab.id ? 'var(--saffron)' : 'rgba(255,255,255,0.6)',
              borderBottom: activeTab === tab.id ? '2px solid var(--saffron)' : '2px solid transparent',
              transition: 'all 0.3s'
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '30px' }}>
        
        {/* Candidates Panel */}
        {activeTab === 'candidates' && (
          <div className="card glass">
            <h3>Add New Candidate</h3>
            <p style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '20px' }}>Register a verified candidate to the blockchain.</p>
            
            <div style={{ display: 'grid', gap: '15px', maxWidth: '500px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="glass-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Political Party</label>
                <input
                  type="text"
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  placeholder="e.g. National Party A"
                  className="glass-input"
                  style={{ width: '100%' }}
                />
              </div>
              <button className="primary" onClick={handleAddCandidate} style={{ marginTop: '10px' }}>
                 + Register Candidate
              </button>
            </div>
          </div>
        )}

        {/* Schedule Panel */}
        {activeTab === 'settings' && (
          <div className="card glass">
             <h3>Election Schedule</h3>
             <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>CURRENT WINDOW</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{dates || 'Not Scheduled'}</div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '600px' }}>
               <div className="form-group">
                 <label>Start Audit Date</label>
                 <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%' }}
                  />
               </div>
               <div className="form-group">
                 <label>End Audit Date</label>
                 <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="glass-input"
                    style={{ width: '100%' }}
                  />
               </div>
             </div>
             <button className="secondary" onClick={handleSetDates} style={{ marginTop: '15px' }}>
               Update Blockchain Schedule
             </button>
          </div>
        )}

        {/* Security / Info Panel */}
        {activeTab === 'security' && (
          <div className="card glass">
            <h3>System Health & Security</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
               <div style={{ padding: '15px', background: 'rgba(76, 175, 80, 0.1)', border: '1px solid var(--green)', borderRadius: '6px' }}>
                 <div style={{ color: 'var(--green)', fontWeight: 'bold' }}>BLOCKCHAIN</div>
                 <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Active & Synced</div>
               </div>
               <div style={{ padding: '15px', background: 'rgba(33, 150, 243, 0.1)', border: '1px solid #2196f3', borderRadius: '6px' }}>
                 <div style={{ color: '#2196f3', fontWeight: 'bold' }}>DATABASE</div>
                 <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Connected (SQLite)</div>
               </div>
               <div style={{ padding: '15px', background: 'rgba(255, 153, 51, 0.1)', border: '1px solid var(--saffron)', borderRadius: '6px' }}>
                 <div style={{ color: 'var(--saffron)', fontWeight: 'bold' }}>NODES</div>
                 <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>3 Validator Nodes</div>
               </div>
            </div>
            
            <p style={{ marginTop: '20px', fontSize: '0.9rem', opacity: 0.6 }}>
              Note: This panel controls the smart contract parameters. All actions are signed by the Admin wallet and recorded immutably.
            </p>
          </div>
        )}

      </div>

      {info && (
        <div className="animate-in" style={{ 
          position: 'fixed', 
          bottom: '20px', 
          right: '20px', 
          background: '#333', 
          padding: '15px 25px', 
          borderRadius: '8px',
          boxShadow: '0 5px 20px rgba(0,0,0,0.5)',
          borderLeft: '4px solid var(--saffron)'
        }}>
          {info}
        </div>
      )}

    </div>
  )
}

export default AdminPage
