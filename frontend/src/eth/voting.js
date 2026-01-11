import { VOTING_CONTRACT_ABI, VOTING_CONTRACT_ADDRESS } from './votingConfig'

// In-Memory Storage for Demo Persistence (Reset on Reload)
// Pre-configured with requested candidates and a default active date window
const DEFAULT_START = Math.floor(Date.now() / 1000) - 86400; // Yesterday
const DEFAULT_END = Math.floor(Date.now() / 1000) + 604800; // Next week

// Added 'state' property to candidates
let candidatesStore = [
  { id: 1, name: "Vaibhav", party: "BJP", state: "Delhi", voteCount: 120 },
  { id: 2, name: "Hriday", party: "AAP", state: "Delhi", voteCount: 95 },
  { id: 3, name: "Vedansh", party: "Congress", state: "Mumbai", voteCount: 88 },
  { id: 4, name: "Akarsh", party: "Independent", state: "Mumbai", voteCount: 45 },
  { id: 5, name: "Shubham", party: "Independent", state: "Bangalore", voteCount: 30 }
]

// Initialize default dates if not present
if (!localStorage.getItem('mock_dates')) {
  localStorage.setItem('mock_dates', JSON.stringify({ start: DEFAULT_START, end: DEFAULT_END }))
}

async function getVotingContract() {
  return {
    account: "0xMockAccount123456",
    contract: {
      methods: {
        // Updated to accept 'state'
        addCandidate: (name, party, state) => ({
          send: async () => {
             const newId = candidatesStore.length + 1
             candidatesStore.push({ id: newId, name, party, state: state || 'Delhi', voteCount: 0 })
             console.log(`[MOCK] Added candidate: ${name} for ${state}`)
             return { status: true }
          }
        }),
        vote: (candidateId) => ({
          send: async () => {
            const c = candidatesStore.find(x => x.id === Number(candidateId))
            if(c) c.voteCount++
            console.log(`[MOCK] Voted for ID: ${candidateId}. New Count: ${c?.voteCount}`)
            return { status: true }
          }
        }),
        setDates: (start, end) => ({
          send: async () => {
            console.log(`[MOCK] Set voting dates: ${start} to ${end}`)
            // Store simple mock dates in localStorage to persist simple testing
            localStorage.setItem('mock_dates', JSON.stringify({ start, end }))
            return { status: true }
          }
        }),
        getDates: () => ({
          call: async () => {
             const d = JSON.parse(localStorage.getItem('mock_dates') || '{}')
             return [d.start || 0, d.end || 0]
          }
        }),
        checkVote: () => ({
          call: async () => false // always allow vote for demo
        }),
        getCountCandidates: () => ({
          call: async () => candidatesStore.length
        }),
        getCandidate: (id) => ({
          call: async () => {
             // 1-based index in contract vs 0-based array
             const c = candidatesStore[id - 1]
             if(!c) return { id: 0, name: "", party: "", state: "", voteCount: 0 }
             // Return array-like object as web3 does, included state
             return { 
                 0: c.id, 1: c.name, 2: c.party, 3: c.voteCount, 4: c.state,
                 id: c.id, name: c.name, party: c.party, state: c.state, voteCount: c.voteCount 
             }
          }
        })
      }
    }
  }
}

export { getVotingContract }

