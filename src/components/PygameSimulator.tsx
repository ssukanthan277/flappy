import React, { useEffect, useRef, useState } from "react";
import { GameConfig } from "../pygameCodeTemplate";
import { 
  Volume2, VolumeX, ShieldAlert, Zap, RefreshCw, Play, CircleDot, Info, 
  Shield, Coins, Clock, Flame, ShoppingBag, Home, Sparkles, Undo2, ChevronRight, Compass
} from "lucide-react";

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
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
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
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(390, now + 0.14);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {}
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
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.07); // A5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  playCoin() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.05); // E6

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {}
  }

  playPowerUp() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(261.63, now); // C4
      osc.frequency.linearRampToValueAtTime(523.25, now + 0.08);
      osc.frequency.linearRampToValueAtTime(783.99, now + 0.16);
      osc.frequency.linearRampToValueAtTime(1046.50, now + 0.32);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.34);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.34);
    } catch (e) {}
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
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.38);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }
}

interface SimulatedPipe {
  x: number;
  topHeight: number;
  bottomY: number;
  bottomHeight: number;
  width: number;
  passed: boolean;
  nearMissTriggered?: boolean;
}

interface SimulatedCoin {
  x: number;
  y: number;
  radius: number;
  angle: number;
  id: string;
  value: number;
  collected: boolean;
}

interface FloatingPowerUp {
  x: number;
  y: number;
  radius: number;
  type: "invincible" | "turbo" | "magnet" | "slow_mo" | "rainbow";
  id: string;
  age: number;
  angle: number;
}

interface ActiveBuff {
  type: "invincible" | "turbo" | "magnet" | "slow_mo" | "rainbow";
  remaining: number; // in frames
  maxDuration: number;
}

interface SimulatedParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  glow?: boolean;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  maxLife: number;
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

  // Coin and Combo persistence
  const [totalCoins, setTotalCoins] = useState<number>(() => {
    const saved = localStorage.getItem("pygame_flappy_total_coins");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [coinsInSession, setCoinsInSession] = useState(0);
  const [combo, setCombo] = useState(1);
  const [highestCombo, setHighestCombo] = useState(1);
  const [powerupsCollected, setPowerupsCollected] = useState(0);

  // Core Game View HUD triggers
  const [gameState, setGameState] = useState<"idle" | "playing" | "game_over">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isKeyboardAlertVisible, setIsKeyboardAlertVisible] = useState(true);

  // Buff Timers in React State for the responsive HUD Display area below the score
  const [activeBuffsList, setActiveBuffsList] = useState<ActiveBuff[]>([]);

  // Shop Cosmetics Equipment
  const [equippedSkin, setEquippedSkin] = useState<string>(() => {
    return localStorage.getItem("pygame_equipped_skin") || "orange";
  });
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    const saved = localStorage.getItem("pygame_unlocked_skins");
    return saved ? JSON.parse(saved) : ["orange"];
  });
  const [isShopOpen, setIsShopOpen] = useState(false);

  // Live references to state for use in performance requestAnimationFrame loop
  const configRef = useRef(config);
  const stateRef = useRef(gameState);
  
  // Game simulation state variables
  const playerRef = useRef({
    y: 300,
    velocity: 0,
    radius: 16,
    x: 80,
  });

  const pipesRef = useRef<SimulatedPipe[]>([]);
  const coinsRef = useRef<SimulatedCoin[]>([]);
  const bubblesRef = useRef<FloatingPowerUp[]>([]);
  const particlesRef = useRef<SimulatedParticle[]>([]);
  const floatTextsRef = useRef<FloatingText[]>([]);
  
  const frameCounterRef = useRef(0);
  const nextPowerUpSpawnRef = useRef(500); // cooldown in frames before next spawn check
  const comboTimerRef = useRef(0); // time remaining for combo decay
  const scoreInLoopRef = useRef(0);
  const tailLocationsRef = useRef<{x: number; y: number}[]>([]); // trail coordinates for Turbo

  // Active Buffs reference kept for high accuracy physics checks
  const buffsRef = useRef<{
    invincible: number;
    turbo: number;
    magnet: number;
    slow_mo: number;
    rainbow: number;
  }>({
    invincible: 0,
    turbo: 0,
    magnet: 0,
    slow_mo: 0,
    rainbow: 0,
  });

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

  // Save skins helpers
  const buySkin = (skin: string, cost: number) => {
    if (totalCoins >= cost && !unlockedSkins.includes(skin)) {
      const updatedCoins = totalCoins - cost;
      const updatedSkins = [...unlockedSkins, skin];
      setTotalCoins(updatedCoins);
      setUnlockedSkins(updatedSkins);
      setEquippedSkin(skin);
      localStorage.setItem("pygame_flappy_total_coins", updatedCoins.toString());
      localStorage.setItem("pygame_unlocked_skins", JSON.stringify(updatedSkins));
      localStorage.setItem("pygame_equipped_skin", skin);
      if (onLog) onLog(`[SHOP] Unlocked & Equipped cosmetic skin: ${skin}! Spent ${cost} coins.`);
    }
  };

  const equipSkin = (skin: string) => {
    if (unlockedSkins.includes(skin)) {
      setEquippedSkin(skin);
      localStorage.setItem("pygame_equipped_skin", skin);
      if (onLog) onLog(`[SHOP] Equipped skin styling: ${skin}`);
    }
  };

  // Particle explosion generators
  const spawnExplosion = (x: number, y: number, color: string, count = 12, sizeSpread = 4, vxSpread = 5) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 1 + Math.random() * vxSpread;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - (Math.random() * 1.5), // drifting slightly upwards
        color,
        size: 1.5 + Math.random() * sizeSpread,
        alpha: 1,
        life: 25 + Math.floor(Math.random() * 25),
        maxLife: 50,
        glow: Math.random() > 0.4
      });
    }
  };

  const spawnSparkle = (x: number, y: number, color = "#ffea75") => {
    particlesRef.current.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2 - 0.5,
      color,
      size: 1.5 + Math.random() * 2,
      alpha: 1,
      life: 15 + Math.floor(Math.random() * 15),
      maxLife: 30,
      glow: true
    });
  };

  // Add customized game logs & notifications
  const addFloatingText = (x: number, y: number, text: string, color = "#ffffff", size = 14) => {
    floatTextsRef.current.push({
      x,
      y,
      text,
      color,
      size,
      life: 45,
      maxLife: 45
    });
  };

  // Handles score updates with integrated multiplier checks & dynamic difficulty curves
  const incrementScore = (increase = 1) => {
    setScore((prev) => {
      const newScore = prev + increase;
      scoreInLoopRef.current = newScore;
      if (onScoreUpdate) onScoreUpdate(newScore);
      
      // Log Success milestones
      if (onLog) onLog(`[SUCCESS] Passed column corridor! Score: ${newScore}`);

      // High Score check
      setBestScore((currentBest) => {
        if (newScore > currentBest) {
          localStorage.setItem("pygame_flappy_high_score", newScore.toString());
          if (onLog) onLog(`[AWARD] 🏆 New high score established: ${newScore}!`);
          return newScore;
        }
        return currentBest;
      });

      // Difficulty level tier trigger alert
      if (newScore > 0 && newScore % 10 === 0) {
        const nextLevel = Math.floor(newScore / 10) + 1;
        if (onLog) onLog(`[LEVEL UP] Environment escalated to Tier ${nextLevel}! Pipes are tighter & scrolls are faster.`);
        // Sparkle explosion inside background on leveling
        spawnExplosion(200, 150, "#10b981", 30, 6, 8);
      }

      return newScore;
    });
    synthRef.current?.playScore();
  };

  const terminateGame = () => {
    // If invincibility or ultimate rainbow shield is active, crash bypassed!
    if (buffsRef.current.invincible > 0 || buffsRef.current.rainbow > 0) {
      return;
    }
    
    setGameState("game_over");
    synthRef.current?.playCrash();
    
    // Persist final aggregated coins to localStorage
    const savedTotalCoins = parseInt(localStorage.getItem("pygame_flappy_total_coins") || "0", 10);
    const finalizedCoins = savedTotalCoins + coinsInSession;
    setTotalCoins(finalizedCoins);
    localStorage.setItem("pygame_flappy_total_coins", finalizedCoins.toString());

    if (onLog) {
      onLog(`[CRITICAL] Collision registered at Y: ${Math.round(playerRef.current.y)}. Engine collapsed!`);
      onLog(`[SUMMARY] Score: ${scoreInLoopRef.current} | Coins Collected: ${coinsInSession} | Unbroken Combo Peak: ${highestCombo} | Power-ups Gained: ${powerupsCollected}`);
    }
  };

  // Reset core simulation matrices & buffers
  const initGameEntities = () => {
    playerRef.current = {
      y: 300,
      velocity: 0,
      radius: 16,
      x: 80,
    };
    pipesRef.current = [];
    coinsRef.current = [];
    bubblesRef.current = [];
    particlesRef.current = [];
    floatTextsRef.current = [];
    tailLocationsRef.current = [];
    
    frameCounterRef.current = 0;
    nextPowerUpSpawnRef.current = 400 + Math.floor(Math.random() * 400); // random frame start (approx 10s of game-time)
    comboTimerRef.current = 0;
    scoreInLoopRef.current = 0;

    buffsRef.current = { invincible: 0, turbo: 0, magnet: 0, slow_mo: 0, rainbow: 0 };
    setActiveBuffsList([]);

    setScore(0);
    setCoinsInSession(0);
    setCombo(1);
    setHighestCombo(1);
    setPowerupsCollected(0);

    if (onScoreUpdate) onScoreUpdate(0);
  };

  const restartAction = () => {
    initGameEntities();
    setGameState("playing");
    if (onLog) onLog(`[INFO] Restarted simulation loop. Activeequipped skin: ${equippedSkin}`);
  };

  const triggerJump = () => {
    const currentForce = configRef.current.jumpForce;
    if (stateRef.current === "idle") {
      initGameEntities();
      setGameState("playing");
      playerRef.current.velocity = currentForce;
      synthRef.current?.playJump();
      if (onLog) onLog("[INFO] Interactive Pygame main framework loaded. Input thread bound.");
    } else if (stateRef.current === "playing") {
      playerRef.current.velocity = currentForce;
      synthRef.current?.playJump();
      // Occasionally emit splash visual under ball on jump
      spawnExplosion(playerRef.current.x, playerRef.current.y + 12, "rgba(255,255,255,0.3)", 3, 2, 2);
    } else if (stateRef.current === "game_over" && !isShopOpen) {
      restartAction();
    }
  };

  // Bind hardware keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShopOpen) return;
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
  }, [bestScore, isShopOpen, equippedSkin, unlockedSkins, coinsInSession, totalCoins]);

  // Obstacle Generation matching standard Pygame geometry, but includes spawning coin nodes within opening gap
  const spawnPipe = () => {
    const width = 70;
    
    // Difficulty curve adjustments (gap narrows as points scale up)
    const activeLevel = Math.floor(scoreInLoopRef.current / 10) + 1;
    const initialGap = configRef.current.pipeGap;
    const scaledGap = Math.max(105, initialGap - (activeLevel - 1) * 6);
    
    const minPipeHeight = 50;
    const maxPipeHeight = 600 - 60 - scaledGap - minPipeHeight;
    const topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
    const bottomY = topHeight + scaledGap;
    const bottomHeight = 600 - 60 - bottomY;

    pipesRef.current.push({
      x: 400 + 10,
      topHeight,
      bottomY,
      bottomHeight,
      width,
      passed: false,
    });

    if (onLog) onLog(`[SPAWN] Pipe Obstacle styled at X: 410. Center gap slot: ${scaledGap}px. (Level: ${activeLevel})`);

    // Spawning 1 standard coin node right inside the open middle corridor center of this column
    coinsRef.current.push({
      x: 400 + 10 + (width / 2) - 8,
      y: topHeight + (scaledGap / 2),
      radius: 8,
      angle: Math.random() * Math.PI,
      id: "coin_" + Math.random().toString(),
      value: 1,
      collected: false
    });

    // Strategy 2: 25% chance of spawning a follow-up wave of 2 wavy coins after the pipes
    if (Math.random() > 0.72) {
      const spacing = 45;
      const coinHeight = topHeight + (scaledGap / 2);
      coinsRef.current.push({
        x: 400 + 10 + width + spacing,
        y: coinHeight - 20,
        radius: 8,
        angle: Math.random() * Math.PI,
        id: "coin_" + Math.random().toString(),
        value: 1,
        collected: false
      });
      coinsRef.current.push({
        x: 400 + 10 + width + spacing * 2,
        y: coinHeight + 20,
        radius: 8,
        angle: Math.random() * Math.PI,
        id: "coin_" + Math.random().toString(),
        value: 1,
        collected: false
      });
    }
  };

  // Spawns power-up bubble at strategic safe vertical points avoiding existing pipes
  const triggerPowerUpBubbleSpawn = () => {
    // Determine a safe Y coordinate keeping it within reach
    const bubbleY = 120 + Math.floor(Math.random() * 300); // vertical reach [120 - 420]
    
    // Choose bubble type dynamically
    const roll = Math.random();
    let type: "invincible" | "turbo" | "magnet" | "slow_mo" | "rainbow" = "magnet";
    
    if (roll < 0.05) {
      type = "rainbow"; // 5% super rare ultimate power
    } else if (roll < 0.28) {
      type = "invincible";
    } else if (roll < 0.52) {
      type = "turbo";
    } else if (roll < 0.76) {
      type = "slow_mo";
    } else {
      type = "magnet";
    }

    const newBubble: FloatingPowerUp = {
      x: 400 + 12,
      y: bubbleY,
      radius: 14,
      type,
      id: "bubble_" + Math.random().toString(),
      age: 0,
      angle: 0
    };

    bubblesRef.current.push(newBubble);
    
    let textAlert = "MAGNET BUBBLE";
    if (type === "invincible") textAlert = "INVINCIBLE SHIELD";
    if (type === "turbo") textAlert = "TURBO SPEED";
    if (type === "slow_mo") textAlert = "TIME WARP";
    if (type === "rainbow") textAlert = "🌟 RARE RAINBOW";

    if (onLog) onLog(`[ALERT] Floating ${textAlert} bubble materialized in the sky! Catch it!`);
  };

  // Classic math for perfect bounding circle to aligned solid rectangle overlap
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

  // Primary animation render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const gameLoop = () => {
      const currentConfig = configRef.current;
      const currentState = stateRef.current;

      // Calculate dynamic level increments
      const activeDifficultyLevel = Math.floor(scoreInLoopRef.current / 10) + 1;
      
      // Determine base game speeds
      let activeWorldSpeed = currentConfig.gameSpeed + (activeDifficultyLevel - 1) * 0.35;
      
      // Apply powerup buff scale variations
      if (buffsRef.current.slow_mo > 0) {
        activeWorldSpeed *= 0.5; // slow time by 50%
      }
      if (buffsRef.current.turbo > 0 || buffsRef.current.rainbow > 0) {
        activeWorldSpeed *= 1.8; // speed-up turbo boost
      }

      // Safe clamp scroll velocity
      if (activeWorldSpeed > 8.5) activeWorldSpeed = 8.5;

      // 1. PHYSICAL GAME MATH UPDATES (Only if actively 'playing')
      if (currentState === "playing") {
        frameCounterRef.current += 1;

        const player = playerRef.current;
        
        // Accumulate trailing dots coordinates for motion blur trail during turbo boost
        if (buffsRef.current.turbo > 0 || buffsRef.current.rainbow > 0) {
          tailLocationsRef.current.push({ x: player.x, y: player.y });
          if (tailLocationsRef.current.length > 5) {
            tailLocationsRef.current.shift();
          }
        } else {
          tailLocationsRef.current = [];
        }

        // Apply constant gravity
        player.velocity += currentConfig.gravity;
        if (player.velocity > 10.0) player.velocity = 10.0;
        player.y += player.velocity;

        // Sync coordinates stats up
        if (onStatsUpdate && frameCounterRef.current % 8 === 0) {
          onStatsUpdate(Math.round(player.y), Number(player.velocity.toFixed(2)));
        }

        // Sky barrier check (bypassed if invincible is on, otherwise crash)
        if (player.y - player.radius < 0) {
          if (buffsRef.current.invincible > 0 || buffsRef.current.rainbow > 0) {
            player.y = player.radius + 1;
            player.velocity = 0.5;
          } else {
            terminateGame();
          }
        }

        // Ground crash boundary
        const groundLevel = 600 - 60;
        if (player.y + player.radius > groundLevel) {
          player.y = groundLevel - player.radius;
          player.velocity = 0;
          terminateGame();
        }

        // Spawning pipeline obstacle scheduling
        const activeInterval = Math.max(75, currentConfig.pipeInterval - (activeDifficultyLevel - 1) * 6);
        if (frameCounterRef.current % activeInterval === 0) {
          spawnPipe();
        }

        // Powerup Spawner Scheduling manager: Check spawn coordinates every randomized interval of frames
        if (bubblesRef.current.length === 0 && activeBuffsList.length === 0) {
          nextPowerUpSpawnRef.current -= 1;
          if (nextPowerUpSpawnRef.current <= 0) {
            triggerPowerUpBubbleSpawn();
            // Re-seed frame count for next check
            nextPowerUpSpawnRef.current = 600 + Math.floor(Math.random() * 600); // 10-20 seconds
          }
        }

        // Update active bubbles movement & collections
        const bubbles = bubblesRef.current;
        for (let i = bubbles.length - 1; i >= 0; i--) {
          const b = bubbles[i];
          b.x -= activeWorldSpeed;
          b.age += 1;
          b.angle += 0.04;

          // Float math sine offset
          const floatOffset = Math.sin(frameCounterRef.current * 0.06) * 1.5;
          b.y += floatOffset;

          // Particle sparkle emitting from floating powerups occasionally
          if (frameCounterRef.current % 12 === 0) {
            let sparkColor = "#e0a96d"; // gold
            if (b.type === "turbo") sparkColor = "#38bdf8"; // blue
            if (b.type === "magnet") sparkColor = "#c084fc"; // purple
            if (b.type === "slow_mo") sparkColor = "#4ade80"; // green
            if (b.type === "rainbow") sparkColor = `hsl(${frameCounterRef.current % 360}, 100%, 70%)`;
            spawnSparkle(b.x, b.y, sparkColor);
          }

          // Sweep expired bubbles offscreen or older than 8s (480 frames)
          if (b.x + b.radius < -20 || b.age > 480) {
            bubbles.splice(i, 1);
            continue;
          }

          // Collision check: player captures power-up bubble!
          const distance = Math.sqrt((player.x - b.x)**2 + (player.y - b.y)**2);
          if (distance < player.radius + b.radius) {
            // TRIGGER SATISFYING MULTI-POP EXPLOSION
            let popColor = "#eab308"; // gold
            let floatingAlert = "INVINCIBLE!";
            let logMsg = "[AWARD] Invincibility Core enabled! Obstacles bypassed.";
            let maxFrames = 300; // 5 seconds

            if (b.type === "turbo") {
              popColor = "#3b82f6";
              floatingAlert = "TURBO BOOST!";
              logMsg = "[AWARD] Speed engine activated! Can phase directly through obstacles.";
              maxFrames = 180; // 3 seconds
            }
            if (b.type === "magnet") {
              popColor = "#a855f7";
              floatingAlert = "COIN MAGNET!";
              logMsg = "[AWARD] Coin Attraction aura generated.";
              maxFrames = 360; // 6 seconds
            }
            if (b.type === "slow_mo") {
              popColor = "#10b981";
              floatingAlert = "TIME SLOW!";
              logMsg = "[AWARD] Local relativistic dilator active. Obstacles slowed.";
              maxFrames = 300; // 5 seconds
            }
            if (b.type === "rainbow") {
              popColor = "#ec4899";
              floatingAlert = "ULTIMATE POWER!";
              logMsg = "[AWARD] RAINBOW CORES ALIGNED! Invincible + Turbo + Magnet combined!";
              maxFrames = 300; // 5 seconds
            }

            // Play audio chime
            synthRef.current?.playPowerUp();

            // Spawn explosive particle bursts
            spawnExplosion(b.x, b.y, popColor, 30, 7, 7);
            addFloatingText(b.x, b.y - 10, floatingAlert, popColor, 15);
            
            if (onLog) onLog(logMsg);

            // Increment totals
            setPowerupsCollected(p => p + 1);

            // Store buff timers in references
            if (b.type === "rainbow") {
              buffsRef.current.rainbow = maxFrames;
              buffsRef.current.invincible = maxFrames;
              buffsRef.current.turbo = maxFrames;
              buffsRef.current.magnet = maxFrames;
            } else {
              buffsRef.current[b.type] = maxFrames;
            }

            // Remove collected bubble
            bubbles.splice(i, 1);
          }
        }

        // Decay active power-up buff references & update status array for React HUD
        const updatedReactBuffs: ActiveBuff[] = [];
        const buffKeys = ["invincible", "turbo", "magnet", "slow_mo", "rainbow"] as const;
        
        buffKeys.forEach((key) => {
          if (buffsRef.current[key] > 0) {
            buffsRef.current[key] -= 1;
            
            let defaultMax = 300;
            if (key === "turbo") defaultMax = 180;
            if (key === "magnet") defaultMax = 360;

            updatedReactBuffs.push({
              type: key,
              remaining: buffsRef.current[key],
              maxDuration: defaultMax
            });
          }
        });
        
        // Batch React update to ensure no infinite render loops (JSON serialization gating)
        if (JSON.stringify(activeBuffsList) !== JSON.stringify(updatedReactBuffs)) {
          setActiveBuffsList(updatedReactBuffs);
        }

        // Update active coins scrolling, spin, and magnet physics attraction vectors
        const coins = coinsRef.current;
        for (let i = coins.length - 1; i >= 0; i--) {
          const c = coins[i];
          
          // Magnet attraction calculation
          const hasMagnetActive = buffsRef.current.magnet > 0 || buffsRef.current.rainbow > 0;
          let movedByMagnet = false;

          if (hasMagnetActive) {
            const dx = player.x - c.x;
            const dy = player.y - c.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Magnet pull active within 160 pixels
            if (dist < 160) {
              const pullSpeed = 4.5 + (160 - dist) * 0.08;
              c.x += (dx / dist) * pullSpeed;
              c.y += (dy / dist) * pullSpeed;
              movedByMagnet = true;
            }
          }

          if (!movedByMagnet) {
            c.x -= activeWorldSpeed;
          }

          c.angle += 0.2; // spin angle

          // Remove coin if scrolled out
          if (c.x + c.radius < -20) {
            coins.splice(i, 1);
            continue;
          }

          // Collision checking (ball triggers collection)
          const distToPlayer = Math.sqrt((player.x - c.x)**2 + (player.y - c.y)**2);
          if (distToPlayer < player.radius + c.radius) {
            // Collected gold coin successfully!
            c.collected = true;
            synthRef.current?.playCoin();

            // Emit shine sparkles at coin point
            spawnExplosion(c.x, c.y, "#ffd700", 8, 3, 3);

            // Update streak combos
            setCoinsInSession((currentCoins) => {
              const newCoinsCount = currentCoins + 1;
              
              setCombo((cStreak) => {
                const nextStreak = cStreak + 1;
                let activeMult = 1;
                
                if (nextStreak >= 10) activeMult = 5;
                else if (nextStreak >= 5) activeMult = 3;
                else if (nextStreak >= 3) activeMult = 2;

                setHighestCombo((h) => Math.max(h, activeMult));
                
                // Overlay text alert on combo changes
                if (activeMult > 1 && nextStreak % 3 === 0) {
                  addFloatingText(c.x, c.y - 12, `COMBO x${activeMult}!`, "#fbbf24", 13);
                }

                return nextStreak;
              });

              return newCoinsCount;
            });

            // Combo Decay reset countdown
            comboTimerRef.current = 300; // 5 seconds to get next coin

            // Apply points with active combos multiplier
            let activeMulti = 1;
            if (combo >= 10) activeMulti = 5;
            else if (combo >= 5) activeMulti = 3;
            else if (combo >= 3) activeMulti = 2;

            incrementScore(activeMulti);

            // Remove coin node
            coins.splice(i, 1);
          }
        }

        // Combo timer decay management
        if (comboTimerRef.current > 0) {
          comboTimerRef.current -= 1;
          if (comboTimerRef.current === 0) {
            setCombo(1); // combo broken!
            if (onLog) onLog(`[INFO] Combo streak decay timer expired. Multiplier reset.`);
          }
        }

        // Process obstacles collision checking
        const pipes = pipesRef.current;
        for (let i = pipes.length - 1; i >= 0; i--) {
          const pipe = pipes[i];
          pipe.x -= activeWorldSpeed;

          // Check passing edge for core scoring
          if (!pipe.passed && pipe.x + pipe.width < player.x) {
            pipe.passed = true;
            incrementScore(); // passed obstacle safely
          }

          // Evaluate Near Miss bonus scores
          // Trigger proximity bonus if player successfully passes midpoint extremely close to edges!
          if (pipe.passed && !pipe.nearMissTriggered) {
            // Calculate distance to closest obstacle boundaries
            const gapClearanceTop = player.y - pipe.topHeight; // spacing above
            const gapClearanceBottom = pipe.bottomY - player.y; // spacing below
            const minimalProximity = Math.min(gapClearanceTop, gapClearanceBottom);

            // If clearance was dangerously close (< player radius + 15px), trigger bonus near miss!
            if (minimalProximity < player.radius + 15 && minimalProximity > 0) {
              pipe.nearMissTriggered = true;
              incrementScore(2); // reward extra +2 score bonus
              addFloatingText(player.x, player.y - 18, "NEAR MISS +2!", "#60a5fa", 13);
              spawnExplosion(player.x, player.y, "#60a5fa", 12, 4, 4);
              if (onLog) onLog(`[DARING] Near Miss registered! Clearance of just ${Math.round(minimalProximity)}px. Extra pts awarded: +2.`);
            }
          }

          // Crash physics
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

          // Remove offscreen columns
          if (pipe.x + pipe.width < -15) {
            pipes.splice(i, 1);
          }
        }

        // Decay active floating texts
        const floatTexts = floatTextsRef.current;
        for (let i = floatTexts.length - 1; i >= 0; i--) {
          const ft = floatTexts[i];
          ft.y -= 0.8; // drift up
          ft.life -= 1;
          if (ft.life <= 0) {
            floatTexts.splice(i, 1);
          }
        }
      }

      // Update and decay background particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 1;
        pt.alpha = pt.life / pt.maxLife;

        if (pt.life <= 0) {
          particles.splice(i, 1);
        }
      }

      // 2. CANVAS RENDERING OPERATIONS
      ctx.clearRect(0, 0, 400, 600);

      // Camera vibration shake offset when Turbo Active
      const isTurbo = buffsRef.current.turbo > 0 || buffsRef.current.rainbow > 0;
      ctx.save();
      if (isTurbo && currentState === "playing") {
        const dxRange = Math.random() * 4 - 2;
        const dyRange = Math.random() * 4 - 2;
        ctx.translate(dxRange, dyRange);
      }

      // Sky Background (Vignette under Time Slow)
      if (buffsRef.current.slow_mo > 0) {
        ctx.fillStyle = "#11221e"; // soft emerald green space vignette
      } else {
        ctx.fillStyle = "#181c29"; // deep indigo space
      }
      ctx.fillRect(0, 0, 400, 600);

      // Parallax Pixel Starfield
      ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
      // Back stars move based on frames
      const parallaxSlow = (frameCounterRef.current * 0.12) % 400;
      const parallaxFast = (frameCounterRef.current * 0.45) % 400;

      ctx.fillRect((100 - parallaxSlow + 400) % 400, 70, 2, 2);
      ctx.fillRect((350 - parallaxSlow + 400) % 400, 150, 3, 3);
      ctx.fillRect((220 - parallaxFast + 400) % 400, 260, 2, 2);
      ctx.fillRect((50 - parallaxFast + 400) % 400, 390, 2, 2);
      ctx.fillRect((290 - parallaxSlow + 400) % 400, 440, 3, 3);

      // Semi-transparent background vector cloud shapes
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      ctx.beginPath();
      ctx.arc((120 - parallaxSlow + 400) % 400, 120, 30, 0, Math.PI * 2);
      ctx.arc((150 - parallaxSlow + 400) % 400, 110, 45, 0, Math.PI * 2);
      ctx.arc((190 - parallaxSlow + 400) % 400, 120, 35, 0, Math.PI * 2);
      ctx.fill();

      // Celestial Moon Node
      ctx.beginPath();
      ctx.arc(320, 90, 40, 0, Math.PI * 2);
      ctx.fillStyle = buffsRef.current.slow_mo > 0 ? "#1b2a24" : "#22283a";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(305, 90, 35, 0, Math.PI * 2);
      ctx.fillStyle = buffsRef.current.slow_mo > 0 ? "#11221e" : "#181c29";
      ctx.fill();

      // Render Active Pipes
      pipesRef.current.forEach(p => {
        // Base cyberpunk coloring options
        let pipeColor = "#2ec4b6";
        let pipeBorder = "#20897f";
        
        if (buffsRef.current.slow_mo > 0) {
          pipeColor = "#10b981"; // neon emerald green green
          pipeBorder = "#047857";
        }

        ctx.strokeStyle = pipeBorder;
        ctx.lineWidth = 3;

        // Draw top pipeline segment
        ctx.fillStyle = pipeColor;
        ctx.fillRect(p.x, 0, p.width, p.topHeight);
        ctx.strokeRect(p.x, -5, p.width, p.topHeight + 5);

        // Draw bottom pipeline segment
        ctx.fillRect(p.x, p.bottomY, p.width, p.bottomHeight);
        ctx.strokeRect(p.x, p.bottomY, p.width, p.bottomHeight + 5);

        // Pipe rim segments top
        const rimYTop = p.topHeight - 20;
        if (rimYTop >= 0) {
          ctx.fillRect(p.x - 4, rimYTop, p.width + 8, 20);
          ctx.strokeRect(p.x - 4, rimYTop, p.width + 8, 20);
        }

        // Pipe rim segments bottom
        ctx.fillRect(p.x - 4, p.bottomY, p.width + 8, 20);
        ctx.strokeRect(p.x - 4, p.bottomY, p.width + 8, 20);
      });

      // Render Active Coins with animated 3D spin width calculations
      coinsRef.current.forEach(c => {
        const spinWidth = Math.abs(Math.sin(c.angle)) * c.radius * 2;
        
        ctx.save();
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#fbbf24";
        ctx.strokeStyle = "#b45309";
        ctx.lineWidth = 1.5;

        // Draw ellipse spinning coin
        ctx.beginPath();
        ctx.ellipse(c.x, c.y, spinWidth / 2, c.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner glowing star shape shine
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius * 0.3 * Math.abs(Math.sin(c.angle)), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Powerup Bubbles in the Sky
      bubblesRef.current.forEach(b => {
        ctx.save();
        
        // Pick primary theme color
        let bubbleColor = "#ffd700"; // gold invincible
        ctx.shadowColor = bubbleColor;
        
        if (b.type === "turbo") bubbleColor = "#38bdf8"; // cyan-blue
        if (b.type === "magnet") bubbleColor = "#c084fc"; // purple
        if (b.type === "slow_mo") bubbleColor = "#4ade80"; // emerald
        if (b.type === "rainbow") {
          bubbleColor = `hsl(${(frameCounterRef.current * 4) % 360}, 100%, 65%)`;
        }

        ctx.shadowBlur = 15;
        
        // Double concentric glowing outer ring circles
        ctx.strokeStyle = bubbleColor;
        ctx.lineWidth = 2.5;
        ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
        
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x - 3, b.y - 3, b.radius - 4, 0, Math.PI * 2);
        ctx.stroke();

        // Draw high fidelity icon glyph context inside bubbles
        ctx.fillStyle = bubbleColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 13px Arial";

        let glyph = "🛡️"; // default shield
        if (b.type === "turbo") glyph = "⚡";
        if (b.type === "magnet") glyph = "🧲";
        if (b.type === "slow_mo") glyph = "⏱️";
        if (b.type === "rainbow") glyph = "🌟";

        ctx.fillText(glyph, b.x, b.y);
        ctx.restore();
      });

      // Draw Ground backplane bottom anchor
      ctx.fillStyle = "#111422";
      ctx.fillRect(0, 540, 400, 60);

      ctx.beginPath();
      ctx.moveTo(0, 540);
      ctx.lineTo(400, 540);
      ctx.strokeStyle = buffsRef.current.slow_mo > 0 ? "#10b981" : "#20897f";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Render active particles
      particlesRef.current.forEach(pt => {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        
        if (pt.glow) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = pt.color;
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Player circle agent
      const p = playerRef.current;

      // Draw ghosts trailing shadow if Turbo speed is active
      tailLocationsRef.current.forEach((loc, index) => {
        ctx.save();
        ctx.globalAlpha = 0.12 * (index + 1);
        ctx.beginPath();
        ctx.arc(loc.x, loc.y, p.radius - 1, 0, Math.PI * 2);
        ctx.fillStyle = "#38bdf8";
        ctx.fill();
        ctx.restore();
      });

      ctx.save();
      
      // Map cosmetics equipped color
      let playerFill = "#ff9f43"; // orange
      let playerOutline = "#be5014";
      
      if (equippedSkin === "green") {
        playerFill = "#10b981";
        playerOutline = "#047857";
      } else if (equippedSkin === "purple") {
        playerFill = "#8b5cf6";
        playerOutline = "#5b21b6";
      } else if (equippedSkin === "gold") {
        playerFill = "#f59e0b";
        playerOutline = "#92400e";
      } else if (equippedSkin === "rainbow") {
        playerFill = `hsl(${(frameCounterRef.current * 3.5) % 360}, 100%, 60%)`;
        playerOutline = `hsl(${(frameCounterRef.current * 3.5 + 180) % 360}, 100%, 40%)`;
      }

      // Draw main player base body shadows
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = playerOutline;
      ctx.fill();

      // Gleam overlay
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius - 2, 0, Math.PI * 2);
      ctx.fillStyle = playerFill;
      ctx.fill();

      // Metallic highlighting
      ctx.beginPath();
      ctx.arc(p.x - 4, p.y - 4, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.48)";
      ctx.fill();

      // Render visual auras around player based on active power-ups
      if (buffsRef.current.invincible > 0 || buffsRef.current.rainbow > 0) {
        // GOLDEN pulsing shield rings
        ctx.strokeStyle = `rgba(250, 204, 21, ${0.4 + Math.sin(frameCounterRef.current * 0.15) * 0.25})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 6 + Math.sin(frameCounterRef.current * 0.1) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (buffsRef.current.magnet > 0 || buffsRef.current.rainbow > 0) {
        // Purple electric magnetism waves
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.3 + Math.sin(frameCounterRef.current * 0.1) * 0.15})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (buffsRef.current.turbo > 0 || buffsRef.current.rainbow > 0) {
        // Blue electric propulsion jet streams
        ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x - p.radius, p.y);
        ctx.lineTo(p.x - p.radius - 12 - Math.random() * 8, p.y);
        ctx.stroke();
      }

      ctx.restore();

      // Render static text labels and logs bubbles
      floatTextsRef.current.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = ft.life / ft.maxLife;
        ctx.font = `bold ${ft.size}px monospace`;
        ctx.fillStyle = ft.color;
        ctx.textAlign = "center";
        
        // Solid black outline drop shadows for superior contrast
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // 3. STATIC CANVAS STATE TEXTS
      if (currentState === "idle") {
        ctx.fillStyle = "rgba(10, 12, 18, 0.4)";
        ctx.fillRect(0, 0, 400, 600);
      }

      ctx.restore(); // restore camera offsets
      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [gameState, equippedSkin, unlockedSkins, coinsInSession, activeBuffsList]);

  return (
    <div className="flex flex-col items-center w-full">
      
      {/* Keyboard alert notification banner */}
      {isKeyboardAlertVisible && (
        <div className="w-full max-w-[400px] bg-[#1e1e1e] border border-[#3c3c3c] text-xs text-slate-300 p-2.5 rounded mb-3 flex items-start gap-2 justify-between">
          <div className="flex gap-2">
            <Info className="w-4 h-4 text-[#007acc] shrink-0 mt-0.5" />
            <span>
              <strong>Pygame Keybinds Active:</strong> Use <kbd className="px-1 py-0.5 bg-[#333333] rounded border border-[#444] text-white text-[10px]">SPACE</kbd> or <kbd className="px-1 py-0.5 bg-[#333333] rounded border border-[#444] text-white text-[10px]">ARROW-UP</kbd> to flap or play, and <kbd className="px-1 py-0.5 bg-[#333333] rounded border border-[#444] text-white text-[10px]">R</kbd> to quick-start inside game over.
            </span>
          </div>
          <button 
            onClick={() => setIsKeyboardAlertVisible(false)} 
            className="text-slate-500 hover:text-white font-bold shrink-0 ml-1 px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Primary Simulator Screen Box Frame */}
      <div 
        ref={containerRef}
        id="pygame-screen"
        onClick={triggerJump}
        className="relative select-none cursor-pointer overflow-hidden rounded-2xl shadow-2xl border-4 border-[#0e0e0e] bg-slate-900 group"
        style={{ width: "400px", height: "600px" }}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="absolute inset-0 block w-full h-full"
        />

        {/* Vintage scan lines overlay filter */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px]" />

        {/* ==========================================
            HUD ACTIVE GAMEPLAY LAYER
            ========================================== */}
        {gameState === "playing" && (
          <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-10 text-sans select-none">
            
            {/* Top HUD Row containing Streak Combos, Center score, and Coins */}
            <div className="flex items-start justify-between w-full h-16">
              
              {/* Combo Streak Indicator on the Left */}
              <div className="flex flex-col gap-1 transition-all duration-200">
                {combo > 1 && (
                  <div className="flex items-center gap-1 bg-[#fbbf24]/95 border border-[#d97706] text-slate-950 font-bold px-2 py-1 rounded shadow-md animate-bounce">
                    <Flame className="w-4 h-4 fill-amber-500" />
                    <span className="text-xs font-black">COMBO x{combo >= 10 ? 5 : combo >= 5 ? 3 : 2}</span>
                  </div>
                )}
                {combo > 1 && (
                  <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full transition-all duration-100 ease-linear"
                      style={{ width: `${(comboTimerRef.current / 300) * 100}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Large centered arcade points score */}
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black text-white hover:scale-105 transition-transform drop-shadow-[0_4px_4px_rgba(0,0,0,0.6)] font-mono">
                  {score}
                </span>
                
                {/* Active environmental difficulty badge */}
                <div className="mt-1 bg-slate-950/80 px-1.5 py-0.5 rounded border border-[#3c3c3c] text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                  TIER {Math.floor(score / 10) + 1} Environment
                </div>
              </div>

              {/* Coin collection display box */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 border border-[#ffd700]/30 px-2 py-1 rounded shadow text-amber-400 font-bold text-xs select-none">
                <Coins className="w-3.5 h-3.5 text-[#ffd700] animate-pulse" />
                <span className="font-mono text-[13px]">{coinsInSession}</span>
              </div>
            </div>

            {/* Bottom Screen interactive indicators overlay */}
            <div className="flex items-center justify-between w-full opacity-60 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-950/95 border border-[#3c3c3c] text-[9px] text-[#007acc] font-mono">
                <CircleDot className="w-2.5 h-2.5 animate-pulse" />
                <span>ACTIVE SIMULATOR</span>
              </div>
              <span className="text-[9px] font-mono text-gray-500 bg-slate-950/80 px-1 rounded">60 FPS BOUND</span>
            </div>
          </div>
        )}

        {/* ==========================================
            START / IDLE MENU SCREEN LAYER (React UI Overlayed)
            ========================================== */}
        {gameState === "idle" && (
          <div className="absolute inset-0 bg-slate-950/80 p-6 flex flex-col justify-between items-center select-none text-center z-10" onClick={(e) => e.stopPropagation()}>
            <div className="mt-8 flex flex-col items-center gap-2">
              {/* Colorful icon launcher */}
              <div className="w-12 h-12 rounded-2xl bg-[#007acc] flex items-center justify-center shadow-lg border border-sky-400 animate-pulse">
                <Compass className="w-7 h-7 text-white" />
              </div>
              
              <h1 className="text-2xl font-black tracking-tight text-white mt-1 drop-shadow-sm font-sans uppercase">
                Pygame Flappy Bubble
              </h1>
              <p className="text-[11px] text-gray-400 font-mono tracking-wide max-w-[280px]">
                Enhanced Mobile Edition Simulator featuring floating power-up cores, shiny coin multi-combos, and near-miss bonuses.
              </p>
            </div>

            {/* Customized Cosmetics selector area inside Launcher */}
            <div className="bg-[#24252a]/95 border border-[#3c3c3c] w-full max-w-[320px] p-3 rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase pb-1 border-b border-[#3c3c3c]">
                <span>SELECT COSMETIC SPHERE</span>
                <span className="text-amber-400 flex items-center gap-0.5 font-mono">
                  <Coins className="w-3 h-3" />
                  {totalCoins}
                </span>
              </div>
              
              <div className="flex gap-1.5 justify-center py-1">
                {/* Orange */}
                <button 
                  onClick={() => equipSkin("orange")}
                  className={`w-8 h-8 rounded-full bg-[#ff9f43] border-2 transition-all ${equippedSkin === "orange" ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"}`}
                  title="Orange Skin"
                />
                
                {/* Green */}
                {unlockedSkins.includes("green") ? (
                  <button 
                    onClick={() => equipSkin("green")}
                    className={`w-8 h-8 rounded-full bg-[#10b981] border-2 transition-all ${equippedSkin === "green" ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"}`}
                  />
                ) : (
                  <button 
                    onClick={() => buySkin("green", 25)}
                    className="w-8 h-8 rounded-full bg-[#10b981]/20 border border-[#10b981]/40 text-[9px] font-bold text-emerald-400 flex items-center justify-center hover:bg-[#10b981]/30"
                    title="Unlock Green: 25 Coins"
                  >
                    25
                  </button>
                )}

                {/* Purple */}
                {unlockedSkins.includes("purple") ? (
                  <button 
                    onClick={() => equipSkin("purple")}
                    className={`w-8 h-8 rounded-full bg-[#8b5cf6] border-2 transition-all ${equippedSkin === "purple" ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"}`}
                  />
                ) : (
                  <button 
                    onClick={() => buySkin("purple", 50)}
                    className="w-8 h-8 rounded-full bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[9px] font-bold text-purple-400 flex items-center justify-center hover:bg-[#8b5cf6]/30"
                    title="Unlock Purple: 50 Coins"
                  >
                    50
                  </button>
                )}

                {/* Gold */}
                {unlockedSkins.includes("gold") ? (
                  <button 
                    onClick={() => equipSkin("gold")}
                    className={`w-8 h-8 rounded-full bg-[#fbbf24] border-2 transition-all ${equippedSkin === "gold" ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"}`}
                  />
                ) : (
                  <button 
                    onClick={() => buySkin("gold", 100)}
                    className="w-8 h-8 rounded-full bg-[#fbbf24]/20 border border-[#fbbf24]/40 text-[9px] font-bold text-amber-300 flex items-center justify-center hover:bg-[#fbbf24]/30"
                    title="Unlock Gold: 100 Coins"
                  >
                    100
                  </button>
                )}

                {/* Rainbow */}
                {unlockedSkins.includes("rainbow") ? (
                  <button 
                    onClick={() => equipSkin("rainbow")}
                    className={`w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 via-emerald-500 to-sky-500 border-2 transition-all ${equippedSkin === "rainbow" ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"}`}
                  />
                ) : (
                  <button 
                    onClick={() => buySkin("rainbow", 150)}
                    className="w-8 h-8 rounded-full bg-slate-800 border border-pink-400/40 text-[8px] font-bold text-pink-300 flex items-center justify-center hover:bg-slate-700"
                    title="Unlock Rainbow: 150 Coins"
                  >
                    150
                  </button>
                )}
              </div>
              <div className="text-[9px] text-gray-500 font-sans tracking-wide">
                Coins persist securely across matches. Click lock-badges to spend savings!
              </div>
            </div>

            {/* Tap Launcher Play button */}
            <button 
              onClick={triggerJump}
              className="py-3 px-8 rounded-full bg-[#007acc] hover:bg-sky-600 active:scale-95 transition-all text-white font-bold text-sm tracking-wide shadow-lg border border-sky-400 flex items-center gap-2 cursor-pointer mb-6"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>TAP TO LAUNCH SIMULATOR</span>
            </button>
          </div>
        )}

        {/* ==========================================
            GAME OVER OVERLAY LAYER (Responsive Retro Modal UI)
            ========================================== */}
        {gameState === "game_over" && (
          <div className="absolute inset-0 bg-slate-950/90 p-5 flex flex-col justify-between items-center z-10 select-none text-sans text-center" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="mt-4 flex flex-col items-center">
              <span className="text-xs bg-rose-500/20 border border-rose-500/40 text-rose-400 font-bold px-2 py-0.5 rounded tracking-widest uppercase">
                Simulation Crumpled
              </span>
              <h2 className="text-3xl font-black text-rose-500 mt-1 uppercase tracking-tight">
                Game Over
              </h2>
            </div>

            {/* High density statistics table card */}
            <div className="w-full max-w-[310px] bg-[#1a1b24]/95 border border-[#3c3c3c] rounded-xl p-4 flex flex-col gap-3 shadow-2xl animate-fade-in">
              <div className="flex justify-between items-center border-b border-[#3c3c3c] pb-1.5 text-xs text-gray-400 font-bold uppercase">
                <span>Final Mission Logs</span>
                <span className="text-[#007acc] font-mono">PYB_01</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3.5 pt-0.5 text-left">
                {/* Score */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Total Score</span>
                  <span className="text-xl font-bold text-white font-mono">{score}</span>
                </div>
                {/* Best Score */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Personal Peak</span>
                  <span className="text-xl font-bold text-amber-400 font-mono">{bestScore}</span>
                </div>
                {/* Coins Collected */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Coins Collected</span>
                  <span className="text-base font-semibold text-amber-300 font-mono flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-[#ffd700]" />
                    +{coinsInSession}
                  </span>
                </div>
                {/* Combo Peak */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Max Combo Multiplier</span>
                  <span className="text-base font-semibold text-[#60a5fa] font-mono">
                    x{highestCombo}
                  </span>
                </div>
                {/* Powerups Gained */}
                <div className="flex flex-col col-span-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Bubble Powerups Captured</span>
                  <span className="text-xs font-medium text-purple-300 font-mono">
                    {powerupsCollected} core bubbles popped
                  </span>
                </div>
              </div>
            </div>

            {/* Cosmetics Customization Quick mini Drawer */}
            <div className="w-full max-w-[310px] bg-[#24252a]/95 border border-[#3c3c3c] p-2 rounded-lg flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase pb-1 border-b border-[#3c3c3c]">
                <span>FAST SHOP / EQUIPPED</span>
                <span className="text-amber-400 font-mono flex items-center gap-0.5">
                  <Coins className="w-2.5 h-2.5" />
                  {totalCoins}
                </span>
              </div>
              <div className="flex gap-1.5 justify-center py-0.5">
                {["orange", "green", "purple", "gold", "rainbow"].map((s) => {
                  const isUnlocked = unlockedSkins.includes(s);
                  let clr = "bg-[#ff9f43]";
                  if (s === "green") clr = "bg-[#10b981]";
                  if (s === "purple") clr = "bg-[#8b5cf6]";
                  if (s === "gold") clr = "bg-[#fbbf24]";
                  if (s === "rainbow") clr = "bg-gradient-to-tr from-pink-500 via-sky-500 to-amber-500";
                  
                  return (
                    <button 
                      key={s}
                      onClick={() => isUnlocked ? equipSkin(s) : buySkin(s, s === "green" ? 25 : s === "purple" ? 50 : s === "gold" ? 100 : 150)}
                      className={`w-6 h-6 rounded-full ${clr} border transition-all text-[8px] flex items-center justify-center font-bold text-white ${equippedSkin === s ? "border-white scale-110 shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}
                    >
                      {!isUnlocked && "🔒"}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action buttons list */}
            <div className="w-full max-w-[310px] flex flex-col gap-2 mb-4">
              <button 
                onClick={restartAction}
                className="w-full py-2.5 rounded bg-[#007acc] hover:bg-sky-600 transition-colors text-white font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>PLAY AGAIN</span>
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setGameState("idle")}
                  className="py-2.5 rounded bg-[#333333] hover:bg-[#444] transition-colors text-slate-300 font-semibold text-xs tracking-wider flex items-center justify-center gap-1 cursor-pointer border border-[#3c3c3c]"
                >
                  <Home className="w-3 h-3" />
                  <span>MAIN MENU</span>
                </button>
                <button 
                  onClick={() => setIsShopOpen(!isShopOpen)}
                  className="py-2.5 rounded bg-amber-500/20 hover:bg-amber-500/35 transition-all text-amber-300 font-semibold text-xs tracking-wider flex items-center justify-center gap-1 cursor-pointer border border-amber-500/40"
                >
                  <ShoppingBag className="w-3 h-3 text-amber-400" />
                  <span>COSMETIC SHOP</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            MOCK FULL CUSTOMIZATION SHOP DIALOG OVERLAY
            ========================================== */}
        {isShopOpen && (
          <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col justify-between items-center z-20 select-none text-sans" onClick={(e) => e.stopPropagation()}>
            
            <div className="w-full flex items-center justify-between border-b border-[#3c3c3c] pb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1 uppercase">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>COSMETICS LABS</span>
              </span>
              <span className="bg-slate-900 border border-[#3c3c3c] rounded px-2 py-0.5 text-[11px] font-bold font-mono text-amber-400 flex items-center gap-1">
                <Coins className="w-3 h-3" />
                {totalCoins} COINS
              </span>
            </div>

            {/* Skins Listing Row Grid */}
            <div className="flex-1 overflow-y-auto w-full py-4 space-y-2 max-h-[380px] pr-1">
              {[
                { id: "orange", name: "Standard Orange", cost: 0, color: "bg-[#ff9f43]", d: "Standard issue spherical rocket test chassis." },
                { id: "green", name: "Emerald Cyber", cost: 25, color: "bg-[#10b981]", d: "Upgraded carbon composite matrix shield casing." },
                { id: "purple", name: "Proton Pulsar", cost: 50, color: "bg-[#8b5cf6]", d: "Magnetic gravity engine shell equipped with hyperdrive vents." },
                { id: "gold", name: "Sunfire Gold", cost: 100, color: "bg-[#fbbf24]", d: "Gilded structural composite. Radiates luxury streaks." },
                { id: "rainbow", name: "Rainbow Spectrum", cost: 150, color: "bg-gradient-to-tr from-pink-500 via-sky-500 to-amber-500", d: "Highly experimental prism reactor shell. Cycles full spectrum colors." },
              ].map((skin) => {
                const isUnlocked = unlockedSkins.includes(skin.id);
                const isEquipped = equippedSkin === skin.id;

                return (
                  <div key={skin.id} className="bg-slate-900/60 border border-[#3c3c3c] rounded-xl p-2.5 flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full ${skin.color} shadow-inner border border-white/20`} />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-white capitalize">{skin.name}</span>
                        <p className="text-[9px] text-gray-500 leading-tight max-w-[150px]">{skin.d}</p>
                      </div>
                    </div>
                    
                    <div>
                      {isEquipped ? (
                        <span className="text-[9px] bg-sky-500/10 border border-sky-500/40 text-sky-400 px-2 py-1 rounded font-bold uppercase">
                          Armed
                        </span>
                      ) : isUnlocked ? (
                        <button 
                          onClick={() => equipSkin(skin.id)}
                          className="bg-[#333333] hover:bg-[#444] text-[9px] text-white font-bold px-2.5 py-1 rounded cursor-pointer transition-colors border border-[#3c3c3c]"
                        >
                          EQUIP
                        </button>
                      ) : (
                        <button 
                          onClick={() => buySkin(skin.id, skin.cost)}
                          disabled={totalCoins < skin.cost}
                          className={`flex items-center gap-1 border text-[9px] font-bold px-2 py-1 rounded transition-colors cursor-pointer ${totalCoins >= skin.cost ? "bg-amber-500/20 border-amber-500 hover:bg-amber-500 text-amber-400 hover:text-slate-900" : "bg-slate-900 border-gray-800 text-gray-600 cursor-not-allowed"}`}
                        >
                          <Coins className="w-2.5 h-2.5" />
                          <span>BUY {skin.cost}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Back action */}
            <button 
              onClick={() => setIsShopOpen(false)}
              className="w-full py-2 rounded bg-[#333333] hover:bg-[#444] text-gray-300 hover:text-white font-bold text-xs tracking-wider cursor-pointer border border-[#3c3c3c]"
            >
              LEAVE cosmetics LABS
            </button>
          </div>
        )}

        {/* ==========================================
            AUDIO FLOATING MUX CONTROLLER
            ========================================== */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute Sound channels" : "Mute Sound channels"}
            className="p-1 px-2 rounded bg-slate-950/85 hover:bg-slate-900/95 text-slate-300 border border-[#3c3c3c] flex items-center gap-1 transition-all"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="text-[10px] font-mono uppercase tracking-wider">{isMuted ? "Muted" : "Active"}</span>
          </button>
        </div>
      </div>

      {/* ==========================================
          DEDICATED POWER-UP USER INTERFACE DISPLAY BAR
          ========================================== */}
      <div id="powerups-countdown-dashboard" className="w-full max-w-[400px] bg-[#252526] border border-[#3c3c3c] rounded-xl p-3 flex flex-col gap-2 mt-3 shadow-md">
        <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase pb-1 border-b border-[#3c3c3c]">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#007acc] animate-pulse" />
            <span>ACTIVE TIMED BUBBLE CORES</span>
          </span>
          <span className="text-gray-500 font-mono">STACKABLE HUD</span>
        </div>

        {activeBuffsList.length === 0 ? (
          <div className="text-[10.5px] text-gray-600 italic text-center py-2">
            No active bubble buffs. Look out for glowing green, blue, gold, purple, and rainbow cores!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 pt-0.5">
            {activeBuffsList.map((buff) => {
              let label = "Invincible Shield";
              let colorClasses = "bg-yellow-400";
              let textHex = "text-yellow-400";
              let icon = <Shield className="w-3.5 h-3.5" />;
              
              if (buff.type === "turbo") {
                label = "Turbo Obstacle-Phase";
                colorClasses = "bg-blue-400 animate-pulse";
                textHex = "text-blue-400 font-bold";
                icon = <Zap className="w-3.5 h-3.5" />;
              }
              if (buff.type === "magnet") {
                label = "Coin Magnetizer Aura";
                colorClasses = "bg-purple-400";
                textHex = "text-purple-400";
                icon = <Coins className="w-3.5 h-3.5" />;
              }
              if (buff.type === "slow_mo") {
                label = "Environmental Time Warp (50%)";
                colorClasses = "bg-emerald-400";
                textHex = "text-emerald-400";
                icon = <Clock className="w-3.5 h-3.5" />;
              }
              if (buff.type === "rainbow") {
                label = "🌟 RAINBOW ENERGY GRID ACTIVATED";
                colorClasses = "bg-gradient-to-r from-pink-500 via-sky-400 to-amber-300 h-full";
                textHex = "text-pink-400 font-black";
                icon = <Sparkles className="w-3.5 h-3.5 animate-spin" />;
              }

              const widthPercent = (buff.remaining / buff.maxDuration) * 100;
              const secondsLeft = (buff.remaining / 60).toFixed(1);

              return (
                <div key={buff.type} className="flex flex-col gap-1 text-[11px] bg-slate-900/60 p-2 rounded border border-[#3c3c3c]">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className={textHex}>{icon}</span>
                      <span className="font-bold text-gray-200">{label}</span>
                    </div>
                    <span className="font-mono text-gray-300 text-[10px]">{secondsLeft}s left</span>
                  </div>
                  
                  {/* Progress Countdown slider line */}
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colorClasses} rounded-full transition-all duration-100 ease-linear`}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Under Screen scores reference widgets */}
      <div className="w-full max-w-[400px] flex items-center justify-between mt-3 text-xs text-slate-400 px-1 font-mono uppercase">
        <div className="flex gap-2.5 items-center">
          <span className="font-semibold text-slate-300">SESSION COIN ACCUM: {coinsInSession}</span>
        </div>
        <div className="flex gap-4">
          <span className="font-semibold text-amber-500 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            SAVINGS BANK: {totalCoins} COINS
          </span>
        </div>
      </div>

    </div>
  );
};
