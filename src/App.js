import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5001');

function App() {
	const [intervalInput, setIntervalInput] = useState('30s');
	const [isRunning, setIsRunning] = useState(false);
	const [logs, setLogs] = useState([]);
	const [currentTime, setCurrentTime] = useState(new Date());

	useEffect(() => {
		socket.on('status-update', (data) => setIsRunning(data.isRunning));

// Listen for incoming live stream console lines
	socket.on('log', (line) => setLogs((prevLogs) => [...prevLogs, line.trim()]));

		return () => {
			socket.off('status-update');
			socket.off('log');
		};
	}, []);

	useEffect(() => {
		const clock = window.setInterval(() => setCurrentTime(new Date()), 1000);
		return () => window.clearInterval(clock);
	}, []);

	const sendRequest = async (endpoint, body) => {
		try {
			const response = await fetch(`http://localhost:5001/api/${endpoint}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: body ? JSON.stringify(body) : undefined,
			});
			const data = await response.json();
			if (!response.ok) setLogs((previousLogs) => [...previousLogs, `Error: ${data.error}`]);
		} catch (error) {
			setLogs((previousLogs) => [...previousLogs, `Connection error: ${error.message}`]);
		}
	};

	const handleStart = () => {
		setLogs([]);
		sendRequest('start', { interval: intervalInput.trim() });
	};

	const handleStop = () => sendRequest('stop');
	const formattedTime = currentTime.toLocaleTimeString([], {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: true,
	});
	const lastLog = logs[logs.length - 1];

	return (
		<main className={`app-shell ${isRunning ? 'is-active' : ''}`}>
			<div className="atmosphere atmosphere-one" />
			<div className="atmosphere atmosphere-two" />
			<header className="site-header">
				<a className="brand" href="/">C / <span>Chronos</span></a>
				<nav aria-label="Main navigation">
					<a className="nav-link active" href="/">Chronos</a>
					<a className="nav-link muted" href="/settings" onClick={(event) => event.preventDefault()}>Settings</a>
				</nav>
			</header>

			<section className="hero" aria-label="Chronos time announcer">
				<div className="hero-copy">
					<p className="eyebrow">The present moment</p>
					<h1>Time, <em>spoken.</em></h1>
					<p className="description">A quiet companion for your focus.</p>
				</div>

				<button
					className={`time-orb ${isRunning ? 'active' : ''}`}
					type="button"
					onClick={isRunning ? handleStop : handleStart}
					aria-label={isRunning ? 'Stop time announcements' : 'Start time announcements'}
				>
					<span className="orb-shine" />
					<span className="orb-content">
						<span className="orb-label">{isRunning ? 'Announcing' : 'Local time'}</span>
						<strong>{formattedTime}</strong>
						<span className="orb-action">{isRunning ? 'Tap to stop' : 'Tap to begin'}</span>
					</span>
				</button>

				<div className="interval-dock">
					<div className="dock-heading"><span>Interval</span><span className="dock-value">{intervalInput}</span></div>
					<div className="interval-options" role="group" aria-label="Announcement interval">
						{['15s', '30s', '1m', '5m'].map((option) => (
							<button key={option} type="button" className={intervalInput === option ? 'selected' : ''} onClick={() => setIntervalInput(option)} disabled={isRunning}>{option}</button>
						))}
						<label className={`custom-interval ${!['15s', '30s', '1m', '5m'].includes(intervalInput) ? 'selected' : ''}`}>
							<input value={['15s', '30s', '1m', '5m'].includes(intervalInput) ? '' : intervalInput} onChange={(event) => setIntervalInput(event.target.value)} placeholder="Custom" disabled={isRunning} aria-label="Custom interval" />
						</label>
					</div>
				</div>
			</section>

			<footer className="status-bar" aria-live="polite">
				<span className={`status-indicator ${isRunning ? 'active' : ''}`} />
				<span>{isRunning ? `Active · every ${intervalInput}` : 'Ready when you are'}</span>
				{lastLog && <span className="last-log">{lastLog}</span>}
			</footer>
		</main>
	);
}

export default App;