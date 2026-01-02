import { useState, useEffect, useRef } from 'react'
import { Terminal, Shield, Gavel, Play, Square, Activity } from 'lucide-react'

// Game Phase State
type GamePhase = 'IDLE' | 'RED_TURN' | 'BLUE_TURN' | 'JUDGE_TURN'

function App() {
  const [logs, setLogs] = useState<any[]>([])
  const [status, setStatus] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [phase, setPhase] = useState<GamePhase>('IDLE')

  // Artifact Content State
  const [redPayload, setRedPayload] = useState("")
  const [blueResponse, setBlueResponse] = useState("")
  const [judgeVerdict, setJudgeVerdict] = useState("")
  const [lastJailbreak, setLastJailbreak] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Use environment variable for API URL (production) or default to localhost (dev)
    const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
    const WS_URL = API_URL.replace(/^http/, 'ws')

    // Connect to WebSocket
    const ws = new WebSocket(`${WS_URL}/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      // Clear old logs and fetch fresh state on reconnect
      setLogs([])
      fetchArtifact('attack', setRedPayload)
      fetchArtifact('response', setBlueResponse)
      fetchArtifact('score', (content) => {
        setJudgeVerdict(content)
        try {
          const data = JSON.parse(content)
          setLastJailbreak(data.jailbreak_success === true)
        } catch { setLastJailbreak(false) }
      })
    }
    ws.onclose = () => setIsConnected(false)
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === "log") {
        setLogs(prev => [...prev, msg.data])
        handleGameLogic(msg.data.message)
      }
    }

    const interval = setInterval(checkStatus, 2000)
    checkStatus()

    return () => {
      ws.close()
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  // Parse logs to update Game State
  const handleGameLogic = (message: string) => {
    if (message.includes("Triggering Red Agent")) {
      setPhase('RED_TURN')
      setRedPayload("Generating Attack Vector...")
      setBlueResponse("")
      setJudgeVerdict("")
    }
    else if (message.includes("Attack Generated")) {
      fetchArtifact('attack', setRedPayload)
    }
    else if (message.includes("Triggering Blue Agent")) {
      setPhase('BLUE_TURN')
      setBlueResponse("Generating Defense parameters...")
    }
    else if (message.includes("Victim Responded")) {
      fetchArtifact('response', setBlueResponse)
    }
    else if (message.includes("Triggering Judge Agent")) {
      setPhase('JUDGE_TURN')
      setJudgeVerdict("Auditing interaction...")
    }
    else if (message.includes("Score:")) {
      fetchArtifact('score', (content) => {
        setJudgeVerdict(content)
        try {
          const data = JSON.parse(content)
          setLastJailbreak(data.jailbreak_success === true)
        } catch { setLastJailbreak(false) }
      })
      setPhase('IDLE')
    }
  }

  const checkStatus = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
      const res = await fetch(`${API_URL}/status`)
      const data = await res.json()
      setStatus(data.is_running)
      if (!data.is_running) setPhase('IDLE')
    } catch (e) { console.error(e) }
  }

  const fetchArtifact = async (name: string, setter: (val: string) => void) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
      const res = await fetch(`${API_URL}/artifact/${name}`)
      const data = await res.json()
      setter(data.content || "Error loading content")
    } catch (e) { setter("Network Error") }
  }

  const [isLoading, setIsLoading] = useState(false)

  const toggleFuzzer = async () => {
    if (isLoading) return  // Prevent double-click
    setIsLoading(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
      const endpoint = status ? "stop" : "start"
      await fetch(`${API_URL}/${endpoint}`, { method: "POST" })
      await checkStatus()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-terminal-black text-terminal-green p-6 font-mono flex flex-col gap-6">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3 text-white">
            <span className="text-cyber-red animate-pulse">⚡</span>
            BREACH
            <span className="text-xs bg-cyber-red text-black px-2 rounded">v1.0</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Autonomous Jailbreak Testing</p>
        </div>

        <div className="flex gap-4 items-center">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isConnected ? 'border-cyber-green bg-cyber-green/10' : 'border-red-500 bg-red-500/10'}`}>
            <Activity size={16} />
            <span className="text-xs font-bold">{isConnected ? "SYSTEM ONLINE" : "DISCONNECTED"}</span>
          </div>

          <button
            onClick={toggleFuzzer}
            disabled={isLoading}
            className={`flex items-center gap-2 px-8 py-3 rounded font-black text-sm tracking-widest transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${status
              ? 'bg-red-600 border border-red-400 text-white hover:bg-red-500'
              : 'bg-green-500 text-black hover:bg-green-400'
              }`}
          >
            {isLoading ? 'LOADING...' : status ? <><Square size={16} fill="currentColor" /> STOP</> : <><Play size={16} fill="currentColor" /> START</>}
          </button>
        </div>
      </header>

      {/* GAME BOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[500px]">
        {/* RED AGENT CARD */}
        <div className={`border rounded-lg p-1 flex flex-col transition-all duration-500 ${phase === 'RED_TURN' ? 'border-cyber-red bg-cyber-red/5 scale-105 shadow-[0_0_30px_rgba(255,0,0,0.2)]' : 'border-gray-800 bg-gray-900/40 opacity-70'}`}>
          <div className="bg-black/50 p-4 border-b border-gray-800 flex items-center gap-3">
            <div className={`p-2 rounded ${phase === 'RED_TURN' ? 'bg-cyber-red text-black' : 'bg-gray-800 text-gray-500'}`}>
              <Terminal size={24} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${phase === 'RED_TURN' ? 'text-cyber-red' : 'text-gray-500'}`}>BAD COP</h3>
              <p className="text-xs text-gray-400">Attacker (Groq 70B)</p>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto max-h-[400px] text-xs leading-relaxed text-gray-300 whitespace-pre-wrap font-sans">
            {(() => {
              try {
                const data = JSON.parse(redPayload)
                return (
                  <div className="flex flex-col gap-4">
                    <div className="bg-red-900/20 p-2 rounded border border-red-900/50">
                      <span className="text-cyber-red font-bold uppercase text-[10px] block mb-1">Strategy Analysis</span>
                      {data.strategy_analysis}
                    </div>
                    <div>
                      <span className="text-gray-500 font-bold uppercase text-[10px] block mb-1">Payload</span>
                      {data.attack_payload}
                    </div>
                  </div>
                )
              } catch (e) {
                return redPayload || <span className="italic text-gray-600">Waiting for trigger...</span>
              }
            })()}
          </div>
        </div>

        {/* BLUE AGENT CARD */}
        <div className={`border rounded-lg p-1 flex flex-col transition-all duration-500 ${phase === 'BLUE_TURN' ? 'border-blue-500 bg-blue-500/5 scale-105 shadow-[0_0_30px_rgba(0,0,255,0.2)]' : 'border-gray-800 bg-gray-900/40 opacity-70'}`}>
          <div className="bg-black/50 p-4 border-b border-gray-800 flex items-center gap-3">
            <div className={`p-2 rounded ${phase === 'BLUE_TURN' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
              <Shield size={24} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${phase === 'BLUE_TURN' ? 'text-blue-500' : 'text-gray-500'}`}>GOOD COP</h3>
              <p className="text-xs text-gray-400">Defender (Groq 70B)</p>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto max-h-[400px] text-xs leading-relaxed text-gray-300 whitespace-pre-wrap font-sans">
            {blueResponse || <span className="italic text-gray-600">Waiting for attack...</span>}
          </div>
        </div>

        {/* JUDGE AGENT CARD */}
        <div className={`border rounded-lg p-1 flex flex-col transition-all duration-500 ${phase === 'JUDGE_TURN' ? 'border-yellow-500 bg-yellow-500/5 scale-105 shadow-[0_0_30px_rgba(255,255,0,0.2)]' : 'border-gray-800 bg-gray-900/40 opacity-70'}`}>
          <div className="bg-black/50 p-4 border-b border-gray-800 flex items-center gap-3">
            <div className={`p-2 rounded ${phase === 'JUDGE_TURN' ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-500'}`}>
              <Gavel size={24} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${phase === 'JUDGE_TURN' ? 'text-yellow-500' : 'text-gray-500'}`}>THE JURY</h3>
              <p className="text-xs text-gray-400">Arbiter (Groq 70B)</p>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto max-h-[400px] flex items-center justify-center">
            {judgeVerdict ? (
              <>
                <div className={`text-6xl font-black mb-4 ${lastJailbreak ? 'text-cyber-green' : 'text-cyber-red'}`}>
                  {lastJailbreak ? 'SUCCESS' : 'FAIL'}
                </div>
                <div className="text-left bg-gray-800/50 p-2 rounded border border-gray-700">
                  <span className="text-xs uppercase font-bold text-gray-500 block mb-1">Judge Reasoning:</span>
                  <p className="text-xs text-gray-300 font-sans leading-relaxed">
                    {(() => {
                      try {
                        const data = JSON.parse(judgeVerdict)
                        return data.reasoning
                      } catch { return judgeVerdict }
                    })()}
                  </p>
                </div>
              </>
            ) : (
              <span className="italic text-gray-600 text-xs">Waiting for verdict...</span>
            )}
          </div>
        </div>
      </div>

      {/* LOG CONSOLE */}
      <div className="border-t border-gray-800 pt-4">
        <h4 className="text-xs text-gray-500 mb-2 uppercase tracking-wide">System Console</h4>
        <div className="h-32 bg-black/50 rounded border border-gray-900 p-2 overflow-y-auto font-mono text-xs text-gray-500">
          {logs.map((log, i) => (
            <div key={i} className="hover:bg-white/5 px-1 rounded">
              <span className="opacity-50 text-[10px] mr-2">[{new Date(log.timestamp * 1000).toLocaleTimeString()}]</span>
              <span className={log.level === 'CRITICAL' ? 'text-cyber-red font-bold' : ''}>{log.message}</span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  )
}

export default App
