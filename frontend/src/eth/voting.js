import { VOTING_CONTRACT_ABI, VOTING_CONTRACT_ADDRESS } from './votingConfig'

async function getVotingContract() {
  // MOCK CONTRACT - Returns fake processing to simulate blockchain without Ganache
  return {
    account: "0xMockAccount123456",
    contract: {
      methods: {
        addCandidate: (name, party) => ({
          send: async () => {
            console.log(`[MOCK] Added candidate: ${name} (${party})`)
            return { status: true }
          }
        }),
        vote: (candidateId) => ({
          send: async () => {
            console.log(`[MOCK] Voted for candidate ID: ${candidateId}`)
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
          call: async () => 2 // return dummy count
        }),
        getCandidate: (id) => ({
          call: async () => {
              // Return dummy candidates for testing
              const cands = [
                  { id: 1, name: "Demo Candidate A", party: "Party A", voteCount: 10 },
                  { id: 2, name: "Demo Candidate B", party: "Party B", voteCount: 15 }
              ]
              return cands[id-1] || { id: 0, name: "", party: "", voteCount: 0 }
          }
        })
      }
    }
  }
}

export { getVotingContract }

