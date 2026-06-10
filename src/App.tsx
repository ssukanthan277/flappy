import React, { useState } from "react";
import { PygameSimulator } from "./components/PygameSimulator";
import { PythonIDE } from "./components/PythonIDE";
import { PhysicsWorkbench } from "./components/PhysicsWorkbench";
import { defaultConfig, GameConfig } from "./pygameCodeTemplate";
import { 
  Gamepad2, Code, Terminal, Sparkles, FolderOpen, ChevronDown, ChevronRight,
  FileCode, Play, Info, Shield, Radio, Activity, Cpu, Code2, Layers, Binary,
  GitBranch, Settings, Compass, Search, HelpCircle, Bug, TerminalSquare
} from "lucide-react";

export default function App() {
  const [config, setConfig] = useState<GameConfig>(defaultConfig);
  const [activeScore, setActiveScore] = useState(0);
  
  // Live coordinates tracking for high-density status bar
  const [ballStats, setBallStats] = useState<{ y: number; velocity: number }>({
    y: 300,
    velocity: 0
  });

  // Log buffer for bottom simulator console
  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] Loading Pygame virtual subsystem environment...",
    "[SYSTEM] Found standard libraries: pygame, sys, random, os",
    "[INFO] Initializing Pygame mixer audio channels...",
    "[INFO] Binding Keyboard listeners: SPACE -> jump, KeyR -> restart",
    "[SUCCESS] Target compiler established. Sandbox operational. Click 'Tap play to jump' or press Space to start compilation."
  ]);

  const handleConfigChange = (newConfig: GameConfig) => {
    setConfig(newConfig);
    addLog(`[CONFIG] Applied updated settings: Gravity=${newConfig.gravity}, Speed=${newConfig.gameSpeed}, Gap=${newConfig.pipeGap}`);
  };

  const addLog = (msg: string) => {
    setLogs(prev => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const stamp = `[${timeStr}] `;
      return [...prev.slice(-30), stamp + msg];
    });
  };

  const handleStatsUpdate = (y: number, velocity: number) => {
    setBallStats({ y, velocity });
  };

  return (
    <div id="developer-workspace" className="min-h-screen bg-[#1e1e1e] text-[#cccccc] font-sans selection:bg-[#007acc]/40 selection:text-white flex flex-col justify-between overflow-hidden">
      
      {/* Top VS-Style Utility Menu Bar */}
      <header className="h-9 bg-[#3c3c3c] border-b border-[#2d2d2d] flex items-center justify-between px-3 text-xs select-none shrink-0">
        <div className="flex items-center gap-3">
          {/* Logo / Title icon */}
          <div className="flex items-center gap-1.5 text-[#007acc]">
            <Gamepad2 className="w-4 h-4" />
            <span className="font-bold text-gray-100 tracking-tight font-sans">Pygame.Simulator</span>
          </div>
          
          {/* Mock Menu Links */}
          <nav className="hidden md:flex items-center gap-3 text-gray-400 font-medium">
            <span className="hover:text-white hover:bg-[#505050] px-2 py-0.5 rounded cursor-pointer transition-colors">File</span>
            <span className="hover:text-white hover:bg-[#505050] px-2 py-0.5 rounded cursor-pointer transition-colors">Edit</span>
            <span className="hover:text-white hover:bg-[#505050] px-2 py-0.5 rounded cursor-pointer transition-colors">Selection</span>
            <span className="hover:text-white hover:bg-[#505050] px-2 py-0.5 rounded cursor-pointer transition-colors">View</span>
            <span className="hover:text-white hover:bg-[#505050] px-2 py-0.5 rounded cursor-pointer transition-colors">Go</span>
            <span className="hover:text-white hover:bg-[#505050] px-2 py-0.5 rounded cursor-pointer transition-colors">Run</span>
            <span className="hover:text-white hover:bg-[#505050] px-2 py-0.5 rounded cursor-pointer transition-colors">Terminal</span>
          </nav>
        </div>

        {/* Global Project State Header Indicator */}
        <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2 bg-[#2d2d2d] px-2.5 py-1 rounded border border-[#4d4d4d]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>LIVE COMPILER: PYGAME 2.5.2 (PYTHON 3.11)</span>
        </div>

        {/* Window controls Mock indicators */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600 cursor-pointer" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-600/60 cursor-pointer" />
          <span className="w-2.5 h-2.5 rounded-full bg-red-600/60 cursor-pointer" />
        </div>
      </header>

      {/* Primary Workspace Window */}
      <div className="flex-1 flex overflow-hidden w-full h-[calc(100vh-60px)]">
        
        {/* Leftmost VS-Style Activity Bar (48px) */}
        <aside className="w-12 bg-[#333333] border-r border-[#2a2a2a] flex flex-col justify-between items-center py-3 shrink-0">
          <div className="flex flex-col gap-5 items-center w-full">
            <button className="text-white hover:text-[#007acc] transition-colors p-1 cursor-pointer" title="Project Files">
              <FolderOpen className="w-5 h-5 text-[#007acc]" />
            </button>
            <button className="text-gray-500 hover:text-white transition-colors p-1 cursor-pointer" title="Search Code">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-gray-500 hover:text-white transition-colors p-1 cursor-pointer" title="Git Repository integrated">
              <GitBranch className="w-5 h-5" />
            </button>
            <button className="text-gray-500 hover:text-white transition-colors p-1 cursor-pointer" title="Debugging Engine">
              <Bug className="w-5 h-5" />
            </button>
            <button className="text-gray-500 hover:text-white transition-colors p-1 cursor-pointer" title="Extensions / Requirements package manager">
              <Cpu className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-col gap-4 items-center">
            <button className="text-gray-500 hover:text-white transition-colors p-1 cursor-pointer" title="App Settings">
              <Settings className="w-5 h-5" />
            </button>
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[10px] text-white">
              AI
            </div>
          </div>
        </aside>

        {/* Directory Explorer & Classes Outline Sidebar (210px) */}
        <aside className="w-[210px] bg-[#252526] border-r border-[#3c3c3c] flex flex-col shrink-0 select-none hidden md:flex">
          {/* Section 1: Files tree list */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="p-2 border-b border-[#3c3c3c] flex items-center justify-between text-gray-400 font-bold text-[10px] uppercase">
              <span>EXPLORER: PYBIRD_PROJECT</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </div>
            
            <div className="p-1.5 space-y-0.5">
              <div className="flex items-center gap-1 text-[#cccccc] hover:bg-[#37373d] p-1 rounded font-mono text-[11px] cursor-pointer">
                <ChevronDown className="w-3 h-3 text-gray-400" />
                <span className="text-gray-500 text-xs font-sans">📁 App</span>
              </div>
              
              <div className="pl-4 space-y-0.5">
                <div className="flex items-center gap-1.5 bg-[#37373d] text-[#ffffff] p-1 px-1.5 rounded font-mono text-[11px] cursor-pointer border-l-2 border-[#007acc]">
                  <FileCode className="w-3.5 h-3.5 text-[#007acc]" />
                  <span>pygame_flappy.py</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-gray-400 hover:bg-[#37373d] p-1 px-1.5 rounded font-mono text-[11px] cursor-pointer">
                  <span className="w-3.5 h-3.5 text-orange-500 font-extrabold text-[10px] flex items-center justify-center">TXT</span>
                  <span>requirements.txt</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-gray-400 hover:bg-[#37373d] p-1 px-1.5 rounded font-mono text-[11px] cursor-pointer">
                  <span className="w-3.5 h-3.5 text-sky-500 font-extrabold text-[10px] flex items-center justify-center">MD</span>
                  <span>README.md</span>
                </div>
              </div>
            </div>

            {/* Section 2: OOP classes inspector outline block */}
            <div className="mt-4 border-t border-[#3c3c3c]">
              <div className="p-2 bg-[#1e1e1e] flex items-center justify-between text-gray-400 font-bold text-[10px] uppercase tracking-wide">
                <span>CLASSES OUTLINE</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </div>
              
              <div className="p-2 space-y-3 font-mono text-[10.5px] text-gray-400 leading-normal">
                {/* Player Class Outline item */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-gray-300 font-semibold">
                    <span className="text-[#4ec9b0]">C</span>
                    <span>Player</span>
                  </div>
                  <div className="pl-3 space-y-0.5 text-gray-500">
                    <div>• def __init__(self, y)</div>
                    <div>• def jump(self)</div>
                    <div>• def update(self)</div>
                  </div>
                </div>

                {/* Pipe Class Outline item */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-gray-200 font-semibold">
                    <span className="text-[#4ec9b0]">C</span>
                    <span>Pipe</span>
                  </div>
                  <div className="pl-3 space-y-0.5 text-gray-500">
                    <div>• def __init__(self, x)</div>
                    <div>• def update(self)</div>
                  </div>
                </div>

                {/* Game Class Outline item */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-gray-200 font-semibold">
                    <span className="text-[#4ec9b0]">C</span>
                    <span>Game</span>
                  </div>
                  <div className="pl-3 space-y-0.5 text-gray-500">
                    <div>• def __init__(self)</div>
                    <div>• def run_loop(self)</div>
                    <div>• def screen_drawn(self)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick instructions box in sidebar */}
          <div className="p-3 bg-[#1e1e1e] border-t border-[#3c3c3c] text-[10px] text-gray-500 font-sans leading-normal">
            <span className="text-[#007acc] font-bold block mb-1">💡 CO-ORDINATED SYNC:</span>
            Modifying sliders in the Physics panel updates configuration matrices on the live simulator immediately.
          </div>
        </aside>

        {/* Master Coding Workspace & Sandbox Stream Grid (Main Panel Split) */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#1e1e1e]">
          
          {/* Sub-Panel 1: Center Coding Area (Code Editor + Logs console drawer) */}
          <section className="flex-1 flex flex-col border-r border-[#3c3c3c] overflow-hidden min-w-0">
            {/* Syntax IDE Workspace Viewport */}
            <div className="flex-1 overflow-auto mini-scrollbar">
              <PythonIDE config={config} />
            </div>

            {/* Downward Console log panel / Integrated Terminal Drawer */}
            <div className="h-44 bg-[#111111] border-t border-[#3c3c3c] flex flex-col shrink-0 min-w-0">
              {/* Console Tabs Runner bar */}
              <div className="h-7 bg-[#1e1e1e] border-b border-[#3c3c3c] px-3 flex items-center justify-between text-[10px] font-mono tracking-wide">
                <div className="flex items-center gap-4 text-gray-500">
                  <span className="font-bold text-white border-b-2 border-[#007acc] pb-1 cursor-pointer">TERMINAL (SIM LOGS)</span>
                  <span className="hover:text-white cursor-pointer select-none">DEBUG CONSOLE</span>
                  <span className="hover:text-white cursor-pointer select-none">OUTPUT LOG</span>
                  <span className="hover:text-white cursor-pointer select-none">PROBLEMS (0)</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-500">
                  <button onClick={() => setLogs([])} className="hover:text-white text-[9px] font-mono hover:bg-[#333] px-1.5 py-0.5 rounded transition-all select-none">
                    CLEAR TERM
                  </button>
                  <span>1: bash</span>
                </div>
              </div>
              
              {/* Output Log lines flow */}
              <div className="flex-1 p-3 font-mono text-[10.5px] text-[#cccccc] overflow-y-auto leading-relaxed space-y-0.5 bg-[#0e0e0e] min-w-0 select-text">
                {logs.map((logLine, idx) => {
                  let colorClass = "text-gray-400";
                  if (logLine.includes("[CRITICAL]")) colorClass = "text-rose-400 font-semibold";
                  if (logLine.includes("[SUCCESS]")) colorClass = "text-emerald-400";
                  if (logLine.includes("[ACTION]")) colorClass = "text-sky-300";
                  if (logLine.includes("[CONFIG]")) colorClass = "text-amber-400";
                  if (logLine.includes("[AWARD]")) colorClass = "text-yellow-400 font-bold";
                  if (logLine.includes("[SYSTEM]")) colorClass = "text-indigo-300 font-medium";

                  return (
                    <div key={idx} className={`${colorClass} whitespace-pre-wrap break-all`}>
                      {logLine}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Sub-Panel 2: Right Active Game Sandbox Panel (Physics + Simulator) */}
          <section className="w-full md:w-[410px] bg-[#252526] flex flex-col overflow-y-auto shrink-0 border-[#3c3c3c]" id="sidebar-emulator-view">
            
            {/* Live Pygame Emulator Window */}
            <div className="p-4 border-b border-[#3c3c3c] bg-[#1e1e1e] flex flex-col items-center gap-3">
              <div className="w-full flex items-center justify-between text-gray-400 pb-2 border-b border-[#3c3c3c]">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Pygame Canvas Frame</span>
                </div>
                <div className="text-[9px] font-mono bg-[#333333] px-1.5 py-0.5 rounded text-gray-300">
                  60 FPS ACTIVE
                </div>
              </div>
              
              {/* Simulator view frame context */}
              <PygameSimulator 
                config={config} 
                onScoreUpdate={setActiveScore} 
                onLog={addLog}
                onStatsUpdate={handleStatsUpdate}
              />
            </div>

            {/* Slider parameters adjustments module */}
            <div className="p-1">
              <PhysicsWorkbench config={config} onChange={handleConfigChange} />
            </div>

            {/* Additional parameters descriptions helper panel */}
            <div className="p-4 bg-[#1e1e1e] border-t border-[#3c3c3c] m-3 rounded flex flex-col gap-2 text-[10.5px] leading-normal text-gray-400">
              <div className="flex items-center gap-1 text-gray-300 font-bold">
                <Info className="w-3.5 h-3.5 text-[#007acc]" />
                <span>Simulation Quick Reference</span>
              </div>
              <p>
                This high fidelity simulator runs standard Pygame frame drawing pipelines. Changes to Gravity and Obstacle interval settings are compiled on-the-fly and parsed directly into your Python scripts generator code on the left tab.
              </p>
            </div>
          </section>

        </main>
      </div>

      {/* Blue VS Studio Status Footer Bar (24px) */}
      <footer className="h-6 bg-[#007acc] text-white flex items-center justify-between px-3 text-[11px] font-mono shrink-0 select-none z-20">
        <div className="flex items-center gap-4">
          {/* Environment Status items */}
          <div className="flex items-center gap-1 bg-[#1f8ad2] px-2 h-full cursor-pointer hover:bg-[#209cf5]">
            <GitBranch className="w-3 h-3 text-white" />
            <span>main *</span>
          </div>
          
          <div className="hidden sm:flex items-center gap-1.5">
            <Radio className="w-2.5 h-2.5 animate-ping text-white" />
            <span>Pygame Engine: Bound</span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span>Score: <strong className="text-white bg-slate-900/40 px-1 py-px rounded">{activeScore}</strong></span>
          </div>
        </div>

        {/* Live coordinate tracking system output logs */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 text-gray-100 bg-[#1f8ad2] px-2 py-0.5 rounded">
            <span>Live Coordinates:</span>
            <span>Y: <strong className="font-bold text-white font-mono">{ballStats.y}px</strong></span>
            <span>Velocity: <strong className="font-bold text-white font-mono">{ballStats.velocity}f/s</strong></span>
          </div>

          <div className="hidden sm:inline-block">
            <span>Python 3.11.4 64-bit</span>
          </div>
          
          <div className="bg-[#1f8ad2] px-2 h-full flex items-center cursor-pointer hover:bg-[#209cf5]">
            <span>UTF-8</span>
          </div>
          
          <div className="bg-emerald-600 px-2 h-full flex items-center">
            <span>🟢 ONLINE</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
