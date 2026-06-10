import React, { useState } from "react";
import { GameConfig, generatePygameCode } from "../pygameCodeTemplate";
import { Copy, Check, Download, FileCode, Terminal, HelpCircle, Shield, ArrowRight } from "lucide-react";

interface PythonIDEProps {
  config: GameConfig;
}

export const PythonIDE: React.FC<PythonIDEProps> = ({ config }) => {
  const [activeTab, setActiveTab] = useState<"code" | "setup" | "structure">("code");
  const [copied, setCopied] = useState(false);

  const pythonCode = generatePygameCode(config);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(pythonCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback if writing fails
    }
  };

  // Safe file downloader anchor trigger
  const downloadPythonFile = () => {
    const blob = new Blob([pythonCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pygame_flappy.py";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="python-ide-container" className="flex flex-col bg-[#1e1e1e] border-b border-[#3c3c3c] h-full min-h-[500px]">
      {/* Editorial IDE Header Tabs */}
      <div className="flex items-center justify-between bg-[#252526] px-4 py-2 border-b border-[#2d2d2d]">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          {/* Active file highlighting indicator */}
          <span className="w-2 h-2 rounded-full bg-[#007acc]" />
          <span className="text-xs text-[#cccccc] font-mono">pygame_flappy.py</span>
          <span className="text-[10px] text-gray-500 font-mono ml-2">App / src</span>
        </div>

        {/* Dynamic Buttons panel */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#333333] hover:bg-[#444444] text-[#cccccc] text-[11px] font-mono transition-all border border-[#3c3c3c] cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy Code</span>
              </>
            )}
          </button>
          
          <button
            onClick={downloadPythonFile}
            title="Download flappy_bird.py file"
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#007acc] hover:bg-[#1a8cd8] text-white text-[11px] font-mono transition-all font-semibold cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Download .py</span>
          </button>
        </div>
      </div>

      {/* Primary Workspace Navigation Grid */}
      <div className="flex bg-[#252526] border-b border-[#2d2d2d] shrink-0 text-xs text-gray-400">
        <button
          onClick={() => setActiveTab("code")}
          className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-mono font-medium transition-all border-b-2 outline-none cursor-pointer ${
            activeTab === "code"
              ? "border-[#007acc] text-white bg-[#1e1e1e]"
              : "border-transparent text-gray-400 hover:text-white hover:bg-[#2d2d2d]"
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-[#007acc]" />
          <span>ACTIVE SOURCE CODE</span>
        </button>

        <button
          onClick={() => setActiveTab("setup")}
          className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-mono font-medium transition-all border-b-2 outline-none cursor-pointer ${
            activeTab === "setup"
              ? "border-[#007acc] text-white bg-[#1e1e1e]"
              : "border-transparent text-gray-400 hover:text-white hover:bg-[#2d2d2d]"
          }`}
        >
          <Terminal className="w-3.5 h-3.5 text-[#007acc]" />
          <span>REQUIREMENTS & RUN</span>
        </button>

        <button
          onClick={() => setActiveTab("structure")}
          className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-mono font-medium transition-all border-b-2 outline-none cursor-pointer ${
            activeTab === "structure"
              ? "border-[#007acc] text-white bg-[#1e1e1e]"
              : "border-transparent text-gray-400 hover:text-white hover:bg-[#2d2d2d]"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#007acc]" />
          <span>DOCUMENTATION ARCHITECTURE</span>
        </button>
      </div>

      {/* Main Tab Content Views */}
      <div className="flex-1 overflow-auto p-4 font-sans text-xs">
        {activeTab === "code" && (
          <div className="relative h-full flex flex-col">
            <div className="mb-2.5 text-[11px] text-gray-400 border border-[#3c3c3c] bg-[#1e1e1e] p-2 hover:bg-[#252526] rounded flex items-center justify-between">
              <span>💡 Physics sliders dynamically write parameter matrices down into this editor live!</span>
              <span className="font-mono text-[#007acc] text-[9px] uppercase font-bold tracking-wider">SYNC COMPILING</span>
            </div>
            
            {/* Scrollable syntax box */}
            <div className="flex-1 min-h-[300px] overflow-auto bg-[#151515] rounded border border-[#3c3c3c] p-3 font-mono text-[11px] leading-relaxed text-[#cccccc]">
              <pre className="whitespace-pre select-text font-mono">{pythonCode}</pre>
            </div>
          </div>
        )}

        {activeTab === "setup" && (
          <div className="space-y-6 text-slate-300">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Local Platform Requirements</span>
              </h3>
              <p className="text-slate-400 text-xs mb-3">
                Ensure your current runtime is compatible with Pygame assets:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs font-mono text-slate-300 bg-[#070b12] p-3.5 rounded-lg border border-slate-800">
                <li>🐍 Python Core Reference: <strong>Python 3.11+</strong> (Standard)</li>
                <li>📦 Dependency packages: <strong>pygame &gt;= 2.5.0</strong></li>
                <li>🖥️ Display: Host OS with standard desktop windows interface supporting frame drawing.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-3">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Command Line Set-up Sequence</span>
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-[10px] font-bold text-slate-300 shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase mb-1">Install Pygame Binding</h4>
                    <p className="text-xs text-slate-400 mb-2">Build native C graphics dependencies via Pip:</p>
                    <div className="bg-[#070b12] p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 select-all flex justify-between items-center">
                      <span>pip install pygame</span>
                      <span className="text-[9px] text-slate-600">Run in shell</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-[10px] font-bold text-slate-300 shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase mb-1">Create Source Document</h4>
                    <p className="text-xs text-slate-400">
                      Save code locally by tapping the top <strong className="text-slate-200">"Download .py"</strong> button or copy the raw script into a file named <code className="px-1.5 py-0.5 rounded bg-slate-800/80 font-mono text-[11px] text-slate-200 border border-slate-700">flappy_bird.py</code>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-[10px] font-bold text-slate-300 shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase mb-1">Boot Game Process</h4>
                    <p className="text-xs text-slate-400 mb-2">Execute file via Python interpreter command:</p>
                    <div className="bg-[#070b12] p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 select-all flex justify-between items-center">
                      <span>python flappy_bird.py</span>
                      <span className="text-[9px] text-slate-600">Run in shell</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "structure" && (
          <div className="space-y-4 text-slate-300 text-xs">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">Object Oriented Structural Flow</h3>
            <p className="text-slate-400 leading-relaxed">
              Designed with strict architectural conformity using structured inheritance-free modular classes modeling standard Pygame logic loops:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                <div className="font-mono text-emerald-400 font-bold mb-1">1. Player Class</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Controls the mass body. Tracks positional speed velocity, handles upward taps impulse force triggers (`JUMP_FORCE`), and calculates vertical coordinates bounding floor collisions.
                </p>
              </div>

              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                <div className="font-mono text-emerald-400 font-bold mb-1">2. Pipe Class</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Implements horizontal shifting logic using dynamic obstacle dimensions. Embeds a robust circle-to-rectangle bounding intercept model keeping standard overlaps precise.
                </p>
              </div>

              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80">
                <div className="font-mono text-emerald-400 font-bold mb-1">3. Game Orchestrator</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Triggers standard frame cycles locking frames limit strictly at `60 FPS`. Runs the update cycle pipeline, manages state machines transitions, and draws textures to the window.
                </p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-950 border border-slate-800 text-[#a8b2c1] rounded-xl flex items-start gap-2 leading-relaxed">
              <span className="text-emerald-400 font-bold font-mono">⚡ SIMULATION NOTE:</span>
              <span>
                The web-based emulator uses a identical JavaScript graphics loop mimicking this script's mathematical formulas 1:1. Adjust parameters in the <strong>Workbench and Sliders</strong> to analyze how different coordinates influence collision outcomes instantly in our browser engine.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Terminal look Console Footer panel info */}
      <div className="bg-[#070b12] py-2 px-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Terminal status: idle</span>
        </div>
        <span>Target: Pygame 2.5.x+ (C SDL backend)</span>
      </div>
    </div>
  );
};
