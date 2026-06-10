import React from "react";
import { GameConfig } from "../pygameCodeTemplate";
import { Sliders, Zap, Sun, ShieldAlert, Award, Undo } from "lucide-react";

interface PhysicsWorkbenchProps {
  config: GameConfig;
  onChange: (newConfig: GameConfig) => void;
}

interface Preset {
  name: string;
  description: string;
  config: GameConfig;
  badge: string;
  color: string;
}

const PRESETS: Preset[] = [
  {
    name: "Classic Pygame",
    description: "Standard physics balance matching original ARCADE ratios.",
    config: {
      gravity: 0.5,
      jumpForce: -8.0,
      gameSpeed: 3.0,
      pipeGap: 140,
      pipeInterval: 100,
    },
    badge: "Balanced",
    color: "from-emerald-500/20 to-emerald-500/5 hover:border-emerald-500/50 border-slate-800",
  },
  {
    name: "Space G-force",
    description: "Lunar environment with soft, floaty gravity curves.",
    config: {
      gravity: 0.2,
      jumpForce: -5.0,
      gameSpeed: 2.2,
      pipeGap: 130,
      pipeInterval: 120,
    },
    badge: "Floaty",
    color: "from-sky-500/20 to-sky-500/5 hover:border-sky-500/50 border-slate-800",
  },
  {
    name: "Hyper Cyber",
    description: "Fast-scrolling cybernetic test with compact openings.",
    config: {
      gravity: 0.6,
      jumpForce: -9.5,
      gameSpeed: 5.0,
      pipeGap: 130,
      pipeInterval: 80,
    },
    badge: "Fast Pace",
    color: "from-fuchsia-500/20 to-fuchsia-500/5 hover:border-fuchsia-500/50 border-slate-800",
  },
  {
    name: "Hardcore Hell",
    description: "Extremely heavy falls coupled with tight narrow corridors.",
    config: {
      gravity: 0.8,
      jumpForce: -11.0,
      gameSpeed: 4.2,
      pipeGap: 110,
      pipeInterval: 75,
    },
    badge: "Hard",
    color: "from-rose-500/20 to-rose-500/5 hover:border-rose-500/50 border-slate-800",
  },
];

export const PhysicsWorkbench: React.FC<PhysicsWorkbenchProps> = ({ config, onChange }) => {
  const handleSliderChange = (key: keyof GameConfig, value: number) => {
    onChange({
      ...config,
      [key]: value,
    });
  };

  const handleReset = () => {
    onChange({
      gravity: 0.5,
      jumpForce: -8.0,
      gameSpeed: 3.0,
      pipeGap: 140,
      pipeInterval: 100,
    });
  };

  return (
    <div id="physics-workbench" className="bg-[#252526] border border-[#3c3c3c] p-4 shadow-md flex flex-col gap-4 font-sans text-xs">
      <div className="flex items-center justify-between border-b border-[#3c3c3c] pb-2">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-[#007acc]" />
          <h2 className="text-[10px] font-bold text-[#cccccc] uppercase tracking-wider">
            Physics Constants Workbench
          </h2>
        </div>
        <button
          onClick={handleReset}
          title="Reset back to standard preset ratios"
          className="p-1 px-2 rounded bg-[#333333] hover:bg-[#444] text-[#cccccc] text-[9px] font-mono border border-[#3c3c3c] flex items-center gap-1 transition-all"
        >
          <Undo className="w-2.5 h-2.5" />
          <span>RESET STD</span>
        </button>
      </div>

      {/* Preset Quick Loader Grid */}
      <div>
        <h3 className="text-[10px] font-bold text-gray-500 uppercase pb-1.5">
          Quick Environment Presets
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onChange(preset.config)}
              className="text-left p-2 rounded bg-[#1e1e1e] hover:bg-[#282828] border border-[#3c3c3c] transition-all duration-200 cursor-pointer flex flex-col gap-0.5"
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-semibold text-[11px] text-gray-200">
                  {preset.name}
                </span>
                <span className="text-[8px] font-mono font-bold px-1 rounded bg-[#333333] text-gray-400">
                  {preset.badge}
                </span>
              </div>
              <p className="text-[9px] text-gray-400 leading-normal">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Physics Sliders Parameter Panel */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase pb-1">
          Adjust Active Simulation variables
        </h3>

        {/* Gravity Control Slider */}
        <div className="space-y-1 p-2 rounded bg-[#1e1e1e] border border-[#3c3c3c]">
          <div className="flex justify-between items-center font-mono text-[10px]">
            <span className="text-gray-400">GRAVITY (px/f²)</span>
            <span className="text-[#007acc] font-bold">{config.gravity.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.10"
            max="1.50"
            step="0.05"
            value={config.gravity}
            onChange={(e) => handleSliderChange("gravity", parseFloat(e.target.value))}
            className="w-full h-1 bg-[#252526] accent-[#007acc] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Jump Force / Thrust control */}
        <div className="space-y-1 p-2 rounded bg-[#1e1e1e] border border-[#3c3c3c]">
          <div className="flex justify-between items-center font-mono text-[10px]">
            <span className="text-gray-400">JUMP_FORCE (px/f)</span>
            <span className="text-[#007acc] font-bold">{config.jumpForce.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="-12.00"
            max="-3.00"
            step="0.5"
            value={config.jumpForce}
            onChange={(e) => handleSliderChange("jumpForce", parseFloat(e.target.value))}
            className="w-full h-1 bg-[#252526] accent-[#007acc] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Game Scrolling Speed */}
        <div className="space-y-1 p-2 rounded bg-[#1e1e1e] border border-[#3c3c3c]">
          <div className="flex justify-between items-center font-mono text-[10px]">
            <span className="text-gray-400">GAME_SPEED (px/f)</span>
            <span className="text-[#007acc] font-bold">{config.gameSpeed.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="1.5"
            max="7.0"
            step="0.1"
            value={config.gameSpeed}
            onChange={(e) => handleSliderChange("gameSpeed", parseFloat(e.target.value))}
            className="w-full h-1 bg-[#252526] accent-[#007acc] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Verticle Pipe Spacing gap height */}
        <div className="space-y-1 p-2 rounded bg-[#1e1e1e] border border-[#3c3c3c]">
          <div className="flex justify-between items-center font-mono text-[10px]">
            <span className="text-gray-400">PIPE_GAP (px)</span>
            <span className="text-[#007acc] font-bold">{Math.round(config.pipeGap)}</span>
          </div>
          <input
            type="range"
            min="100"
            max="220"
            step="5"
            value={config.pipeGap}
            onChange={(e) => handleSliderChange("pipeGap", parseInt(e.target.value, 10))}
            className="w-full h-1 bg-[#252526] accent-[#007acc] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Horizontal Pipe Spawning intervals */}
        <div className="space-y-1 p-2 rounded bg-[#1e1e1e] border border-[#3c3c3c]">
          <div className="flex justify-between items-center font-mono text-[10px]">
            <span className="text-gray-400">PIPE_INTERVAL (frames)</span>
            <span className="text-[#007acc] font-bold">{Math.round(config.pipeInterval)}</span>
          </div>
          <input
            type="range"
            min="60"
            max="180"
            step="5"
            value={config.pipeInterval}
            onChange={(e) => handleSliderChange("pipeInterval", parseInt(e.target.value, 10))}
            className="w-full h-1 bg-[#252526] accent-[#007acc] rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
