import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import GradientOrb, { type GradientOrbConfig } from './components/ui/gradient-orb';
import './App.css';

const socket = io('http://localhost:5001');
type StatusUpdate = { isRunning: boolean };
const orbConfig: GradientOrbConfig = { background: 'transparent', hue: 65, rotationSpeed: 0.22, noiseScale: 0.65, innerRadius: 0.1 };

function App() {
  const [intervalInput, setIntervalInput] = useState('30s');
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const handleStatus = (data: StatusUpdate) => setIsRunning(data.isRunning);
    const handleLog = (line: string) => setLogs((previous) => [...previous, line.trim()]);
    socket.on('status-update', handleStatus);
    socket.on('log', handleLog);
    return () => { socket.off('status-update', handleStatus); socket.off('log', handleLog); };
  }, []);

  useEffect(() => {
    const clock = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  const sendRequest = async (endpoint: 'start' | 'stop', body?: { interval: string }) => {
    try {
      const response = await fetch(`http://localhost:5001/api/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
      const data: { error?: string } = await response.json();
      if (!response.ok) setLogs((previous) => [...previous, `Error: ${data.error ?? 'Request failed'}`]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown connection error';
      setLogs((previous) => [...previous, `Connection error: ${message}`]);
    }
  };

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const presets = ['15s', '30s', '1m', '5m'];
  const lastLog = logs[logs.length - 1];

  return (
    <main className={`relative min-h-screen overflow-hidden bg-[#101311] px-6 text-[#f4f3ed] transition-colors duration-700 md:px-16 ${isRunning ? 'bg-[#10251b]' : ''}`}>
      <div className="pointer-events-none absolute inset-0 -z-0 bg-[radial-gradient(circle_at_50%_48%,rgba(200,166,117,0.12),transparent_28%),radial-gradient(circle_at_50%_50%,transparent_40%,rgba(0,0,0,0.42)_100%)]" />
      <div className="ambient-texture ambient-texture-one" />
      <div className="ambient-texture ambient-texture-two" />
      <header className="relative z-10 mx-auto flex max-w-[1440px] items-center justify-between border-b border-white/10 py-7">
        <a className="text-[15px] font-bold tracking-[-0.03em]" href="/">C / <span className="font-normal text-white/55">Chronos</span></a>
        <nav className="flex gap-7 text-xs"><a className="relative text-white after:absolute after:-bottom-3 after:left-0 after:right-0 after:h-px after:bg-[#c8a675]" href="/">Chronos</a><a className="cursor-default text-white/35" href="/settings" onClick={(event) => event.preventDefault()}>Settings</a></nav>
      </header>

      <section className="relative mx-auto flex min-h-[calc(100vh-118px)] max-w-[1440px] flex-col items-center pb-20 pt-[clamp(64px,9vh,120px)]" aria-label="Chronos time announcer">
        <div className="absolute left-0 top-[clamp(70px,12vh,150px)]"><p className="mb-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[#c8a675]">The present moment</p><h1 className="max-w-[260px] text-[clamp(30px,4vw,56px)] font-medium leading-[0.98] tracking-[-0.07em]">Time, <em className="not-italic text-white/40">spoken.</em></h1><p className="mt-[18px] text-[13px] text-white/50">A quiet companion for your focus.</p></div>

        <button className="relative mt-[2vh] grid aspect-square w-[min(90vw,620px)] cursor-pointer place-items-center overflow-hidden rounded-full bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-[#c8a675]" type="button" onClick={() => (isRunning ? sendRequest('stop') : sendRequest('start', { interval: intervalInput.trim() }))} aria-label={isRunning ? 'Stop time announcements' : 'Start time announcements'}>
          <GradientOrb config={orbConfig} className="pointer-events-none absolute inset-0" />
          <span className="relative z-10 flex w-[78%] -translate-y-0.5 flex-col items-center gap-3 text-center"><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/65">{isRunning ? 'Announcing' : 'Local time'}</span><strong className="whitespace-nowrap text-[clamp(30px,4.2vw,52px)] font-medium leading-none tracking-[-0.07em]">{formattedTime}</strong><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#c8a675]">{isRunning ? 'Tap to stop' : 'Tap to begin'}</span></span>
        </button>

        <div className="absolute bottom-[clamp(80px,13vh,150px)] right-0 w-[210px] rounded-[14px] border border-white/15 bg-white/[0.06] p-[15px] shadow-[0_18px_50px_rgba(0,0,0,0.2)] backdrop-blur-lg"><div className="mb-[13px] flex justify-between font-mono text-[10px] uppercase tracking-[0.08em] text-white/50"><span>Interval</span><span className="text-[#c8a675]">{intervalInput}</span></div><div className="grid grid-cols-4 gap-[5px]" role="group" aria-label="Announcement interval">{presets.map((option) => <button key={option} type="button" className={`h-[29px] rounded-md border text-[10px] font-medium text-white/55 transition-colors ${intervalInput === option ? 'border-[#c8a675]/50 bg-[#c8a675]/15 text-white' : 'border-transparent'}`} onClick={() => setIntervalInput(option)} disabled={isRunning}>{option}</button>)}<label className="col-span-4 block h-[29px] rounded-md border border-white/10"><input className="h-full w-full bg-transparent text-center font-mono text-[10px] text-white outline-none placeholder:text-white/35" value={presets.includes(intervalInput) ? '' : intervalInput} onChange={(event) => setIntervalInput(event.target.value)} placeholder="Custom" disabled={isRunning} aria-label="Custom interval" /></label></div></div>
      </section>

      <footer className="absolute bottom-7 left-6 right-6 flex items-center gap-2 font-mono text-[10px] text-white/45 md:left-16 md:right-16" aria-live="polite"><span className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-[#8dd49c] shadow-[0_0_12px_#8dd49c]' : 'bg-white/35'}`} /><span>{isRunning ? `Active · every ${intervalInput}` : 'Ready when you are'}</span>{lastLog && <span className="ml-auto max-w-[42%] truncate text-white/30">{lastLog}</span>}</footer>
    </main>
  );
}

export default App;