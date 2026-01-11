import React, { useState } from 'react'
import { motion } from 'framer-motion'

const CONSTITUENCIES = [
	'Andhra Pradesh',
	'Arunachal Pradesh',
	'Assam',
	'Bihar',
	'Chhattisgarh',
	'Goa',
	'Gujarat',
	'Haryana',
	'Himachal Pradesh',
	'Jharkhand',
	'Karnataka',
	'Kerala',
	'Madhya Pradesh',
	'Maharashtra',
	'Manipur',
	'Meghalaya',
	'Mizoram',
	'Nagaland',
	'Odisha',
	'Punjab',
	'Rajasthan',
	'Sikkim',
	'Tamil Nadu',
	'Telangana',
	'Tripura',
	'Uttar Pradesh',
	'Uttarakhand',
	'West Bengal',
	'Delhi',
	'Jammu & Kashmir',
	'Ladakh',
	'Puducherry',
]

const WelcomePage = () => {
	const [query, setQuery] = useState('')
	const [chatInput, setChatInput] = useState('')
	const [messages, setMessages] = useState([
		{
			from: 'bot',
			text: 'Namaste! I am your Election Help assistant. Ask me how to vote, how this portal works, or about SSI & offline ballots.',
		},
	])

	const filtered = CONSTITUENCIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()))

	const handleAsk = () => {
		const q = chatInput.trim()
		if (!q) return
		const next = [...messages, { from: 'user', text: q }]

		let answer =
			"I'm a demo assistant. For now, I can answer questions like:\n" +
			'• How do I cast my vote?\n' +
			'• What is Self-Sovereign Identity?\n' +
			'• How does offline voting work here?'

		const lower = q.toLowerCase()
		if (lower.includes('how') && lower.includes('vote')) {
			answer =
				'To cast your vote, log in as a voter, go to the Voter Portal, and select your preferred candidate. Your vote is recorded immutably on the ledgers.'
		} else if (lower.includes('self-sovereign') || lower.includes('ssi')) {
			answer =
				'Self-Sovereign Identity (SSI) ensures you own your digital identity. cryptographic keys stored in your browser sign your ballot, proving authenticity without revealing personal data.'
		} else if (lower.includes('offline')) {
			answer =
				'Our Offline Protocol accepts signed ballots even without internet. They are queued locally and synced securely to the blockchain once connectivity is restored.'
		}

		next.push({ from: 'bot', text: answer })
		setMessages(next)
		setChatInput('')
	}

	const onKeyDown = (e) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			handleAsk()
		}
	}

	return (
		<div className="animate-in" style={{ width: '100%', paddingBottom: '40px' }}>
			{/* Hero Section */}
			<section style={{ textAlign: 'center', marginBottom: '40px' }}>
				<h1
					style={{
						fontSize: '2.5rem',
						background: 'linear-gradient(to right, var(--saffron), #fff, var(--green))',
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
						marginBottom: '10px',
					}}
				>
					Democracy on Blockchain
				</h1>
				<p
					style={{
						maxWidth: '600px',
						margin: '0 auto',
						opacity: 0.8,
						fontSize: '1.1rem',
					}}
				>
					Welcome to the Election Commission of India's decentralized voting portal.
					<br />
					Experience transparent, tamper-proof, and accessible elections.
				</p>
			</section>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
					gap: '20px',
					maxWidth: '1000px',
					margin: '0 auto',
				}}
			>
				{/* Info Card - Left */}
				<div className="card glass">
					<h2
						style={{
							borderBottom: '1px solid rgba(255,255,255,0.1)',
							paddingBottom: '10px',
							marginBottom: '15px',
						}}
					>
						Constituency Search
					</h2>
					<div className="form-group">
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Find your constituency..."
							className="glass-input"
							style={{ width: '100%' }}
						/>
					</div>
					<div
						style={{
							maxHeight: '250px',
							overflowY: 'auto',
							display: 'flex',
							flexDirection: 'column',
							gap: '8px',
						}}
					>
						{filtered.map((c) => (
							<div
								key={c}
								style={{
									padding: '10px',
									background: 'rgba(255,255,255,0.05)',
									borderRadius: '6px',
									display: 'flex',
									alignItems: 'center',
									gap: '10px',
								}}
							>
								<div
									style={{
										width: '8px',
										height: '8px',
										borderRadius: '50%',
										background: 'var(--green)',
									}}
								></div>
								{c}
							</div>
						))}
						{filtered.length === 0 && (
							<div style={{ opacity: 0.5, fontStyle: 'italic' }}>No matches found</div>
						)}
					</div>
				</div>

				{/* Chat Bot - Right */}
				<div className="card glass" style={{ display: 'flex', flexDirection: 'column' }}>
					<h2
						style={{
							borderBottom: '1px solid rgba(255,255,255,0.1)',
							paddingBottom: '10px',
							marginBottom: '15px',
						}}
					>
						Election Assistant AI
					</h2>

					<div
						style={{
							flex: 1,
							minHeight: '200px',
							maxHeight: '300px',
							overflowY: 'auto',
							marginBottom: '15px',
							background: 'rgba(0,0,0,0.2)',
							padding: '15px',
							borderRadius: '8px',
						}}
					>
						{messages.map((m, i) => (
							<div
								key={i}
								style={{
									marginBottom: '10px',
									textAlign: m.from === 'user' ? 'right' : 'left',
								}}
							>
								<div
									style={{
										display: 'inline-block',
										padding: '8px 12px',
										borderRadius: '12px',
										background:
											m.from === 'user'
												? 'var(--primary)'
												: 'rgba(255,255,255,0.1)',
										color: 'white',
										maxWidth: '85%',
										fontSize: '0.9rem',
										lineHeight: '1.4',
									}}
								>
									{m.text}
								</div>
							</div>
						))}
					</div>

					<div style={{ display: 'flex', gap: '10px' }}>
						<input
							type="text"
							value={chatInput}
							onChange={(e) => setChatInput(e.target.value)}
							onKeyDown={onKeyDown}
							placeholder="Ask about voting..."
							className="glass-input"
							style={{ flex: 1 }}
						/>
						<button
							className="secondary"
							onClick={handleAsk}
							style={{ padding: '0 15px' }}
						>
							➤
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default WelcomePage
