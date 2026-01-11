// Static configuration for the Voting smart contract used by the React frontend.
// Using a dummy address for testing - replace with real deployed contract address

export const VOTING_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890'

// Minimal ABI for the Voting.sol contract
export const VOTING_CONTRACT_ABI = [
  {
    constant: false,
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'party', type: 'string' }
    ],
    name: 'addCandidate',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [{ name: 'candidateID', type: 'uint256' }],
    name: 'vote',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getCountCandidates',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ name: 'candidateID', type: 'uint256' }],
    name: 'getCandidate',
    outputs: [
      { name: '', type: 'uint256' },
      { name: '', type: 'string' },
      { name: '', type: 'string' },
      { name: '', type: 'uint256' }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'getDates',
    outputs: [
      { name: '', type: 'uint256' },
      { name: '', type: 'uint256' }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'checkVote',
    outputs: [{ name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
]
