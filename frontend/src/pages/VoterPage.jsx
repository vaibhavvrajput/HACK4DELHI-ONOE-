import React, { useEffect, useState } from 'react'
import { getVotingContract } from '../eth/voting'

const VoterPage = () => {
  const [candidates, setCandidates] = useState([])
  const [dates, setDates] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [account, setAccount] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [canVote, setCanVote] = useState(false)
  const [eligibility, setEligibility] = useState('')
  const [results, setResults] = useState(null)

  useEffect(() => {
    const init = async () => {
      try {
        const { contract, account } = await getVotingContract()
        setAccount(account)

        // Load candidates
        const count = await contract.methods.getCountCandidates().call()
        const list = []
        for (let i = 1; i <= Number(count); i++) {
          const data = await contract.methods.getCandidate(i).call()
          const [id, name, party, voteCount] = data
          list.push({ id, name, party, voteCount })
        }
        setCandidates(list)

        // Load voting window
        const [start, end] = await contract.methods.getDates().call()
        const startSec = Number(start)
        const endSec = Number(end)
        const nowSec = Math.floor(Date.now() / 1000)

        if (startSec && endSec) {
          const s = new Date(startSec * 1000)
          const e = new Date(endSec * 1000)
          setDates(`${s.toLocaleDateString()} - ${e.toLocaleDateString()}`)
        }

        // Check if user has already voted
        const voted = await contract.methods.checkVote().call({ from: account })

        // Compute eligibility
        let status = ''
        let canVoteFlag = false
        if (!startSec || !endSec) {
          status = 'SCHEDULE PENDING'
        } else if (nowSec < startSec) {
          status = 'NOT STARTED'
        } else if (nowSec >= endSec) {
          status = 'ENDED'
        } else if (voted) {
          status = 'VOTED'
        } else {
          status = 'ELIGIBLE'
          canVoteFlag = true
        }
        setEligibility(status)
        setCanVote(canVoteFlag)

        // Compute results if voting has ended
        if (endSec && nowSec >= endSec && list.length) {
          let maxVotes = 0
          list.forEach((c) => {
            const votes = Number(c.voteCount)
            if (votes > maxVotes) maxVotes = votes
          })
          const winners = list.filter((c) => Number(c.voteCount) === maxVotes)
          setResults({ status: 'ended', maxVotes, winners })
        } 
      } catch (err) {
        console.error(err)
        setMessage('Failed to load voting data.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleVote = async (id) => {
    if (!canVote) return
    if (!window.confirm('Confirm your vote? This action cannot be undone.')) return
    
    // Optimistic Update
    setSelectedId(id)
    setMessage('Processing your vote securely...')
    
    try {
      const { contract, account } = await getVotingContract()
      await contract.methods.vote(id).send({ from: account })
      
      setMessage('Vote cast successfully!')
      setEligibility('VOTED')
      setCanVote(false)
      
      // Refresh candidates directly to show updated count immediately in demo
      const count = await contract.methods.getCountCandidates().call()
      const list = []
      for (let i = 1; i <= Number(count); i++) {
        const data = await contract.methods.getCandidate(i).call()
        const [cid, name, party, voteCount] = data
        list.push({ id: cid, name, party, voteCount })
      }
      setCandidates(list)

    } catch (err) {
      console.error(err)
      setMessage('Transaction failed.')
      setSelectedId(null)
    }
  }

  // --- UI Components ---

  const StatusBadge = ({ status }) => {
    let color = 'gray'
    if (status === 'ELIGIBLE') color = '#4caf50' // Green
    if (status === 'VOTED') color = '#2196f3' // Blue
    if (status === 'ENDED') color = '#f44336' // Red
    
    return (
      <span style={{ 
        background: color, 
        color: 'white', 
        padding: '4px 12px', 
        borderRadius: '20px', 
        fontSize: '0.75rem', 
        fontWeight: 'bold',
        boxShadow: `0 2px 10px ${color}66`
      }}>
        {status}
      </span>
    )
  }

  return (
    <div className="animate-in" style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header Stats */}
      <div className="card glass" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
         <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>General Election 2026</h2>
            <div style={{ opacity: 0.6, fontSize: '0.9rem', marginTop: '5px' }}>
              Voting Period: {dates || 'Not Set'}
            </div>
         </div>
         <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '5px' }}>YOUR STATUS</div>
            <StatusBadge status={eligibility} />
         </div>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner"></div></div>}

      {/* Message Banner */}
      {message && (
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          borderLeft: '4px solid var(--primary)', 
          padding: '15px', 
          marginBottom: '20px', 
          borderRadius: '4px' 
        }}>
          {message}
        </div>
      )}

      {/* Results Banner (If Ended) */}
      {results && results.status === 'ended' && (
        <div className="card glass" style={{ 
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(0,0,0,0))', 
          border: '1px solid #4caf50',
          marginBottom: '30px', 
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#81c784' }}>🏆 ELECTION RESULTS DECLARED</h3>
          <p>Winner: <strong style={{ fontSize: '1.2rem', color: 'white' }}>{results.winners.map(w => w.name).join(' & ')}</strong> with {results.maxVotes} votes</p>
        </div>
      )}

      {/* Candidates Grid */}
      <h3 style={{ marginLeft: '10px', marginBottom: '15px', borderLeft: '3px solid var(--saffron)', paddingLeft: '10px' }}>Official Candidates</h3>
      
      {candidates.length === 0 && !loading && (
         <div style={{ opacity: 0.5, fontStyle: 'italic', padding: '20px' }}>No candidates listed yet.</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {candidates.map((candidate) => (
          <div key={candidate.id} className={`card glass ${selectedId === candidate.id ? 'active-card' : ''}`} style={{ 
            transition: 'transform 0.2s',
            position: 'relative',
            overflow: 'hidden'
          }}>
             {/* Decorative Background Icon */}
             <div style={{ position: 'absolute', top: -10, right: -10, fontSize: '5rem', opacity: 0.05, fontWeight: 'bold' }}>
               {candidate.party.charAt(0)}
             </div>

             <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--saffron)', letterSpacing: '1px' }}>
                  {candidate.party}
                </div>
                <h3 style={{ margin: '5px 0' }}>{candidate.name}</h3>
             </div>

             {/* Vote Count (Only visible if ended or admin/demo mode - kept simple for now) */}
             <div style={{ fontSize: '0.9rem', opacity: 0.6, marginBottom: '20px' }}>
               Current Votes: {candidate.voteCount}
             </div>

             <button 
               className={canVote ? 'primary' : 'disabled'}
               style={{ width: '100%' }}
               onClick={() => handleVote(candidate.id)}
               disabled={!canVote}
             >
               {selectedId === candidate.id ? 'VOTED' : 'VOTE FOR CANDIDATE'}
             </button>
          </div>
        ))}
      </div>
      
    </div>
  )
}

export default VoterPage
