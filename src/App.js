import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const socket = io('http://localhost:5001');

function App() {
	const [intervalInput, setIntervalInput] = useState('30s');
	const [isRunning, setIsRunning] = useState(false);
	const [logs, setLogs] = useState([]);
	const [currentTime, setCurrentTime] = useState(new Date());
	const orbCanvasRef = useRef(null);
	const activeRef = useRef(false);

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

	useEffect(() => {
		activeRef.current = isRunning;
	}, [isRunning]);

	useEffect(() => {
		const canvas = orbCanvasRef.current;
		if (!canvas) return undefined;

		const context = canvas.getContext('2d');
		const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let animationFrame;
		let width = 0;
		let height = 0;

		const resize = () => {
			const bounds = canvas.getBoundingClientRect();
			const pixelRatio = window.devicePixelRatio || 1;
			width = bounds.width;
			height = bounds.height;
			canvas.width = width * pixelRatio;
			canvas.height = height * pixelRatio;
			context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
		};

		const draw = (timestamp) => {
			const time = reduceMotion ? 0 : timestamp * 0.00035;
			const active = activeRef.current;
			context.clearRect(0, 0, width, height);
			context.save();
			context.beginPath();
			context.arc(width / 2, height / 2, width / 2 - 1, 0, Math.PI * 2);
			context.clip();

			const rimGradient = context.createLinearGradient(0, 0, width, height);
			rimGradient.addColorStop(0, active ? 'rgba(191, 246, 198, .9)' : 'rgba(255, 255, 255, .82)');
			rimGradient.addColorStop(.42, active ? 'rgba(91, 194, 111, .2)' : 'rgba(196, 224, 215, .12)');
			rimGradient.addColorStop(.7, active ? 'rgba(151, 230, 164, .7)' : 'rgba(230, 205, 161, .66)');
			rimGradient.addColorStop(1, 'rgba(255, 255, 255, .08)');
			context.translate(width / 2, height / 2);
			context.rotate(time * .22);
			context.lineWidth = width * .022;
			context.strokeStyle = rimGradient;
			context.beginPath();
			const rimPoints = 96;
			for (let index = 0; index <= rimPoints; index += 1) {
				const angle = (index / rimPoints) * Math.PI * 2;
				const wave = Math.sin(angle * 5 + time * 1.4) * width * .012 + Math.sin(angle * 9 - time) * width * .006;
				const radius = width * .485 + wave;
				const x = Math.cos(angle) * radius;
				const y = Math.sin(angle) * radius;
				if (index === 0) context.moveTo(x, y);
				else context.lineTo(x, y);
			}
			context.stroke();
			context.lineWidth = width * .008;
			context.strokeStyle = 'rgba(255, 255, 255, .5)';
			context.beginPath();
			context.arc(0, 0, width * .472, Math.PI * 1.05, Math.PI * 1.72);
			context.stroke();
			context.restore();

			if (!reduceMotion) animationFrame = window.requestAnimationFrame(draw);
		};

		resize();
		window.addEventListener('resize', resize);
		draw(0);
		return () => {
			window.cancelAnimationFrame(animationFrame);
			window.removeEventListener('resize', resize);
		};
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
					<canvas className="orb-liquid" ref={orbCanvasRef} aria-hidden="true" />
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