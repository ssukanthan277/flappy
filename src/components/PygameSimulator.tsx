import React, { useEffect, useRef, useState } from "react";
import { GameConfig } from "../pygameCodeTemplate";
import { Volume2, VolumeX, ShieldAlert, Zap, RefreshCw, Play, CircleDot, Info } from "lucide-react";

interface PygameSimulatorProps {
  config: GameConfig;
  onScoreUpdate?: (score: number) => void;
  onLog?: (message: string) => void;
  onStatsUpdate?: (y: number, velocity: number) => void;
}

// 8-Bit Retro Synth Engine using Web Audio API
class AudioSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Initialized lazily on first audio interaction
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
  }

  playJump() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(360, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {
      // Ignored gracefully in sandboxes
    }
  }

  playScore() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      // Ignored
    }
  }

  playCrash() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {
      // Ignored
    }
  }
}

interface SimulatedPipe {
  x: number;
  topHeight: number;
  bottomY: number;
  bottomHeight: number;
  width: number;
  passed: boolean;
}

export const PygameSimulator: React.FC<PygameSimulatorProps> = ({ config, onScoreUpdate, onLog, onStatsUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const synthRef = useRef<AudioSynth | null>(null);

  // Score states
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    const saved = localStorage.getItem("pygame_flappy_high_score");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [gameState, setGameState] = useState<"idle" | "playing" | "game_over">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isKeyboardAlertVisible, setIsKeyboardAlertVisible] = useState(true);

  // Keep live references to state for use in requestAnimationFrame loop
  const configRef = useRef(config);
  const stateRef = useRef(gameState);
  
  // Game simulation state variables (re-initialized on play/restart)
  const playerRef = useRef({
    y: 300,
    velocity: 0,
    radius: 16,
    x: 80,
  });

  const pipesRef = useRef<SimulatedPipe[]>([]);
  const frameCounterRef = useRef(0);

  // Sync config & state refs
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // Audio synth initialization
  useEffect(() => {
    if (!synthRef.current) {
      synthRef.current = new AudioSynth();
    }
    synthRef.current.setMuted(isMuted);
  }, [isMuted]);

  // Handle score callbacks
  const incrementScore = () => {
    setScore((prev) => {
      const newScore = prev + 1;
      if (onScoreUpdate) onScoreUpdate(newScore);
      if (onLog) onLog(`[SUCCESS] Passed obstacle pillar column! Score increased: ${newScore}`);
      setBestScore((currentBest) => {
        if (newScore > currentBest) {
          localStorage.setItem("pygame_flappy_high_score", newScore.toString());
          if (onLog) onLog(`[AWARD] New all-time Personal Best: ${newScore} points!`);
          return newScore;
        }
        return currentBest;
      });
      return newScore;
    });
    synthRef.current?.playScore();
  };

  const terminateGame = () => {
    setGameState("game_over");
    synthRef.current?.playCrash();
    if (onLog) onLog(`[CRITICAL] Circle overlapped with obstacle Rect bounds. Collapse at Y: ${Math.round(playerRef.current.y)}.`);
  };

  // Reset core physics entities
  const initGameEntities = () => {
    playerRef.current = {
      y: 300,
      velocity: 0,
      radius: 16,
      x: 80,
    };
    pipesRef.current = [];
    frameCounterRef.current = 0;
    setScore(0);
    if (onScoreUpdate) onScoreUpdate(0);
  };

  const restartAction = () => {
    initGameEntities();
    setGameState("playing");
    if (onLog) onLog(`[INFO] Restart requested. Simulation re-loaded. High score anchor: ${bestScore}`);
  };

  const triggerJump = () => {
    const currentForce = configRef.current.jumpForce;
    if (stateRef.current === "idle") {
      initGameEntities();
      setGameState("playing");
      playerRef.current.velocity = currentForce;
      synthRef.current?.playJump();
      if (onLog) onLog("[INFO] Instantiating Pygame surface. Interactive game loop initialized.");
    } else if (stateRef.current === "playing") {
      playerRef.current.velocity = currentForce;
      synthRef.current?.playJump();
      if (onLog) onLog(`[ACTION] SPACEBAR tap. Jump impulse applied: ${currentForce.toFixed(1)} px/f`);
    } else if (stateRef.current === "game_over") {
      restartAction();
    }
  };

  // Keyboard monitoring
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser default scroll behaviors when playing in iframe
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        triggerJump();
      } else if (e.code === "KeyR" && stateRef.current === "game_over") {
        e.preventDefault();
        restartAction();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bestScore]);

  // Spawn pipe details matching python calculation logic
  const spawnPipe = () => {
    const width = 70;
    const gapHeight = configRef.current.pipeGap;
    const minPipeHeight = 50;
    const maxPipeHeight = 600 - 60 - gapHeight - minPipeHeight;
    const topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
    const bottomY = topHeight + gapHeight;
    const bottomHeight = 600 - 60 - bottomY;

    pipesRef.current.push({
      x: 400 + 10,
      topHeight,
      bottomY,
      bottomHeight,
      width,
      passed: false,
    });
    if (onLog) onLog(`[INFO] Spawning pipe obstacle. Opening corridor: ${topHeight}px -> ${bottomY}px (gap: ${gapHeight}px)`);
  };

  // Dedicated circle to standard aligned-rectangle intersection math 
  const checkCircleRectOverlap = (
    cx: number, cy: number, radius: number,
    rx: number, ry: number, rw: number, rh: number
  ): boolean => {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));

    const dx = cx - closestX;
    const dy = cy - closestY;

    return (dx * dx + dy * dy) < (radius * radius);
  };

  // Primary rendering + update state loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const gameLoop = () => {
      // Grab direct live snapshot values
      const currentConfig = configRef.current;
      const currentState = stateRef.current;

      // 1. UPDATE GAME PHYSICS (Only if state is 'playing')
      if (currentState === "playing") {
        frameCounterRef.current += 1;

        // Apply constant gravity
        const player = playerRef.current;
        player.velocity += currentConfig.gravity;
        
        // Terminal velocity clamp
        if (player.velocity > 10.0) player.velocity = 10.0;
        player.y += player.velocity;

        if (onStatsUpdate && frameCounterRef.current % 10 === 0) {
          onStatsUpdate(Math.round(player.y), Number(player.velocity.toFixed(2)));
        }

        // Sky barrier crash trigger
        if (player.y - player.radius < 0) {
          terminateGame();
        }

        // Floor crash trigger
        const groundLevel = 600 - 60;
        if (player.y + player.radius > groundLevel) {
          player.y = groundLevel - player.radius;
          player.velocity = 0;
          terminateGame();
        }

        // Timer interval check for obstacle spawning
        if (frameCounterRef.current % currentConfig.pipeInterval === 0) {
          spawnPipe();
        }

        // Process active double pipes items
        const pipes = pipesRef.current;
        for (let i = pipes.length - 1; i >= 0; i--) {
          const pipe = pipes[i];
          pipe.x -= currentConfig.gameSpeed;

          // Check passing thresholds
          if (!pipe.passed && pipe.x + pipe.width < player.x) {
            pipe.passed = true;
            incrementScore();
          }

          // Evaluate intersection collision conditions
          const topHit = checkCircleRectOverlap(
            player.x, player.y, player.radius,
            pipe.x, 0, pipe.width, pipe.topHeight
          );
          const bottomHit = checkCircleRectOverlap(
            player.x, player.y, player.radius,
            pipe.x, pipe.bottomY, pipe.width, pipe.bottomHeight
          );

          if (topHit || bottomHit) {
            terminateGame();
          }

          // Cleanup stale pipe allocations
          if (pipe.x + pipe.width < -15) {
            pipes.splice(i, 1);
          }
        }
      }

      // 2. RENDER THE SCENE FLUSHING LAYERS
      ctx.clearRect(0, 0, 400, 600);

      // Sky Background (Soft twilight glow)
      ctx.fillStyle = "#181c29";
      ctx.fillRect(0, 0, 400, 600);

      // Draw stylized pixel stars background
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(60, 80, 2, 2);
      ctx.fillRect(280, 140, 3, 3);
      ctx.fillRect(150, 250, 2, 2);
      ctx.fillRect(350, 40, 2, 2);
      ctx.fillRect(90, 410, 3, 3);

      // Celestial Moon Vector
      ctx.beginPath();
      ctx.arc(320, 100, 40, 0, Math.PI * 2);
      ctx.fillStyle = "#22283a";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(305, 100, 35, 0, Math.PI * 2);
      ctx.fillStyle = "#181c29";
      ctx.fill();

      // Render Active Pipes
      pipesRef.current.forEach(p => {
        // Core Teal style top segment
        ctx.fillStyle = "#2ec4b6";
        ctx.fillRect(p.x, 0, p.width, p.topHeight);

        // Cyber outline border top
        ctx.strokeStyle = "#20897f";
        ctx.lineWidth = 3;
        ctx.strokeRect(p.x, -5, p.width, p.topHeight + 5);

        // Core Teal style bottom segment
        ctx.fillStyle = "#2ec4b6";
        ctx.fillRect(p.x, p.bottomY, p.width, p.bottomHeight);

        // Cyber outline border bottom
        ctx.strokeRect(p.x, p.bottomY, p.width, p.bottomHeight + 5);

        // Pipe rim accent highlights top
        const rimYTop = p.topHeight - 20;
        if (rimYTop >= 0) {
          ctx.fillStyle = "#2ec4b6";
          ctx.fillRect(p.x - 4, rimYTop, p.width + 8, 20);
          ctx.strokeRect(p.x - 4, rimYTop, p.width + 8, 20);
        }

        // Pipe rim accent highlights bottom
        ctx.fillStyle = "#2ec4b6";
        ctx.fillRect(p.x - 4, p.bottomY, p.width + 8, 20);
        ctx.strokeRect(p.x - 4, p.bottomY, p.width + 8, 20);
      });

      // Ground backplane bottom anchor layout
      ctx.fillStyle = "#0f121a";
      ctx.fillRect(0, 540, 400, 60);

      // Separator ground divider accent line
      ctx.beginPath();
      ctx.moveTo(0, 540);
      ctx.lineTo(400, 540);
      ctx.strokeStyle = "#20897f";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Player circle agent drawing
      const p = playerRef.current;
      // Draw outer circle shadow bounding layer
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#be5014";
      ctx.fill();

      // Draw shiny core player body
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius - 2, 0, Math.PI * 2);
      ctx.fillStyle = "#ff9f43";
      ctx.fill();

      // Gleam reflection spot highlight
      ctx.beginPath();
      ctx.arc(p.x - 4, p.y - 4, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.fill();

      // 3. OVERLAY STATUS LABELS
      if (currentState === "idle") {
        // Semi-transparent start backboard shading
        ctx.fillStyle = "rgba(10, 12, 18, 0.75)";
        ctx.fillRect(0, 0, 400, 600);

        ctx.font = "bold 26px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText("PYGAME CLONE", 200, 240);

        ctx.font = "14px monospace";
        ctx.fillStyle = "#a8b2c1";
        ctx.fillText("Click Here or Tap SPACE to play", 200, 280);

        ctx.font = "italic 12px Arial";
        ctx.fillStyle = "#2ec4b6";
        ctx.fillText("Virtual 400x600 Pygame Window Simulated", 200, 480);
      } else if (currentState === "playing") {
        // Score indicator
        ctx.font = "bold 34px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(score.toString(), 200, 70);
      } else if (currentState === "game_over") {
        // Translucent overlay blackout panel
        ctx.fillStyle = "rgba(10, 12, 18, 0.88)";
        ctx.fillRect(0, 0, 400, 600);

        // Crash Warning Box
        ctx.font = "bold 28px Arial";
        ctx.fillStyle = "#e64c65";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", 200, 210);

        ctx.font = "16px sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`Current Score: ${score}`, 200, 260);

        ctx.fillStyle = "#ffd700";
        ctx.fillText(`All-Time Best: ${bestScore}`, 200, 295);

        ctx.font = "14px monospace";
        ctx.fillStyle = "#8c96af";
        ctx.fillText("Press R or Tap Screen to Restart", 200, 360);

        ctx.font = "12px sans-serif";
        ctx.fillStyle = "#5c657a";
        ctx.fillText("Controls map directly to Pygame keys", 200, 395);
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [gameState, score, bestScore]);

  return (
    <div className="flex flex-col items-center">
      {/* Keyboard binding support warning */}
      {isKeyboardAlertVisible && (
        <div className="w-full max-w-[400px] bg-slate-900 border border-slate-800 text-xs text-slate-300 p-2.5 rounded-lg mb-3 flex items-start gap-2 justify-between">
          <div className="flex gap-2">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Keyboard Active:</strong> Press <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 text-white text-[10px]">SPACE</kbd> to flap or start, and <kbd className="px-1 py-0.5 bg-slate-800 rounded border border-slate-700 text-white text-[10px]">R</kbd> to restart.
            </span>
          </div>
          <button 
            onClick={() => setIsKeyboardAlertVisible(false)} 
            className="text-slate-500 hover:text-slate-300 font-bold shrink-0 ml-1 px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Screen Frame Emulation */}
      <div 
        ref={containerRef}
        id="pygame-screen"
        onClick={triggerJump}
        className="relative select-none cursor-pointer group active:scale-[0.99] transition-transform duration-75 overflow-hidden rounded-2xl shadow-2xl border-4 border-slate-950 bg-slate-900"
        style={{ width: "400px", height: "600px" }}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="absolute inset-0 block w-full h-full"
        />

        {/* Soft Retro scanline texture filter */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />

        {/* HUD Quick Icons bar */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute Retro Synth" : "Mute Sound FX"}
            className="p-1 px-2 rounded-md bg-slate-950/80 hover:bg-slate-900/90 text-slate-300 border border-slate-800/60 flex items-center gap-1 transition-all"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="text-[10px] font-mono uppercase tracking-wider">{isMuted ? "Silent" : "Synth"}</span>
          </button>
        </div>

        {/* Live metadata visual tags footer details inside screen boundaries */}
        <div className="absolute bottom-16 left-4 flex items-center gap-2.5 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-800 text-[10px] text-emerald-400 font-mono">
            <CircleDot className="w-2.5 h-2.5 animate-pulse" />
            <span>PYGAME CORE</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 shadow-slate-950">FPS: 60</span>
        </div>
      </div>

      {/* Under Screen quick buttons helper */}
      <div className="w-full max-w-[400px] flex items-center justify-between mt-3 text-xs text-slate-400 px-1">
        <div className="flex gap-1.5 items-center">
          <span className="font-semibold text-slate-300">SCORE: {score}</span>
        </div>
        <div className="flex gap-4">
          <span className="font-semibold text-amber-400">BEST RUN: {bestScore}</span>
        </div>
      </div>
    </div>
  );
};
