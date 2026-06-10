import React, { useEffect, useRef, useState } from "react";
import { GameConfig } from "../pygameCodeTemplate";
import { 
  Volume2, VolumeX, Shield, Zap, Coins, Clock, Flame, 
  ShoppingBag, Home, Sparkles, RefreshCw, Play, Settings, 
  Info, X, Trophy, ChevronRight, HelpCircle
} from "lucide-react";

interface PygameSimulatorProps {
  config: GameConfig;
  onScoreUpdate?: (score: number) => void;
  onLog?: (message: string) => void;
  onStatsUpdate?: (y: number, velocity: number) => void;
}

// 8-Bit Retro Synth Sound Effects Engine (Web Audio API)
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
      osc.frequency.exponentialRampToValueAtTime(395, now + 0.14);

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
      osc.frequency.exponentialRampToValueAtTime(25, now + 0.4);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.42);
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

  // Game state flow
  const [gameState, setGameState] = useState<"idle" | "playing" | "game_over">("idle");
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem("pygame_muted") === "true";
  });
  const [isPaused, setIsPaused] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Active Buffs list for transparent overlay inside canvas frame
  const [activeBuffsList, setActiveBuffsList] = useState<ActiveBuff[]>([]);

  // Cosmetics setup
  const [equippedSkin, setEquippedSkin] = useState<string>(() => {
    return localStorage.getItem("pygame_equipped_skin") || "orange";
  });
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    const saved = localStorage.getItem("pygame_unlocked_skins");
    return saved ? JSON.parse(saved) : ["orange"];
  });

  // Keep references updated for the dynamic RAF animation loop
  const configRef = useRef(config);
  const stateRef = useRef(gameState);
  const pausedRef = useRef(isPaused);
  
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
  const nextPowerUpSpawnRef = useRef(500); 
  const comboTimerRef = useRef(0); 
  const scoreInLoopRef = useRef(0);
  const tailLocationsRef = useRef<{x: number; y: number}[]>([]); 

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

  // Sync refs
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  // Audio setup
  useEffect(() => {
    if (!synthRef.current) {
      synthRef.current = new AudioSynth();
    }
    synthRef.current.setMuted(isMuted);
    localStorage.setItem("pygame_muted", isMuted.toString());
  }, [isMuted]);

  // Buy Skin helper
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
      synthRef.current?.playPowerUp();
    }
  };

  const equipSkin = (skin: string) => {
    if (unlockedSkins.includes(skin)) {
      setEquippedSkin(skin);
      localStorage.setItem("pygame_equipped_skin", skin);
      synthRef.current?.playJump();
    }
  };

  const resetAllProgress = () => {
    if (window.confirm("Are you sure you want to delete all coins, skins, and highscores?")) {
      localStorage.clear();
      setBestScore(0);
      setTotalCoins(0);
      setEquippedSkin("orange");
      setUnlockedSkins(["orange"]);
      setIsSettingsOpen(false);
      synthRef.current?.playCrash();
    }
  };

  // Particle generators
  const spawnExplosion = (x: number, y: number, color: string, count = 12, sizeSpread = 4, vxSpread = 5) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 1 + Math.random() * vxSpread;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - (Math.random() * 1.5),
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

  const incrementScore = (increase = 1) => {
    setScore((prev) => {
      const newScore = prev + increase;
      scoreInLoopRef.current = newScore;
      if (onScoreUpdate) onScoreUpdate(newScore);

      setBestScore((currentBest) => {
        if (newScore > currentBest) {
          localStorage.setItem("pygame_flappy_high_score", newScore.toString());
          return newScore;
        }
        return currentBest;
      });

      if (newScore > 0 && newScore % 10 === 0) {
        spawnExplosion(200, 150, "#10b981", 24, 6, 8);
      }

      return newScore;
    });
    synthRef.current?.playScore();
  };

  const terminateGame = () => {
    if (buffsRef.current.invincible > 0 || buffsRef.current.rainbow > 0) {
      return;
    }
    
    setGameState("game_over");
    synthRef.current?.playCrash();
    
    // Save coins
    const savedTotalCoins = parseInt(localStorage.getItem("pygame_flappy_total_coins") || "0", 10);
    const finalizedCoins = savedTotalCoins + coinsInSession;
    setTotalCoins(finalizedCoins);
    localStorage.setItem("pygame_flappy_total_coins", finalizedCoins.toString());
  };

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
    nextPowerUpSpawnRef.current = 400 + Math.floor(Math.random() * 400);
    comboTimerRef.current = 0;
    scoreInLoopRef.current = 0;

    buffsRef.current = { invincible: 0, turbo: 0, magnet: 0, slow_mo: 0, rainbow: 0 };
    setActiveBuffsList([]);

    setScore(0);
    setCoinsInSession(0);
    setCombo(1);
    setHighestCombo(1);
    setPowerupsCollected(0);
    setIsPaused(false);

    if (onScoreUpdate) onScoreUpdate(0);
  };

  const restartAction = () => {
    initGameEntities();
    setGameState("playing");
  };

  const triggerJump = () => {
    if (isPaused || isShopOpen || isSettingsOpen) return;

    const currentForce = configRef.current.jumpForce;
    if (stateRef.current === "idle") {
      initGameEntities();
      setGameState("playing");
      playerRef.current.velocity = currentForce;
      synthRef.current?.playJump();
    } else if (stateRef.current === "playing") {
      playerRef.current.velocity = currentForce;
      synthRef.current?.playJump();
      spawnExplosion(playerRef.current.x, playerRef.current.y + 12, "rgba(255,255,255,0.25)", 3, 2, 2);
    } else if (stateRef.current === "game_over") {
      restartAction();
    }
  };

  // Keyboard binding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShopOpen || isSettingsOpen) return;
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        triggerJump();
      } else if (e.code === "KeyR" && stateRef.current === "game_over") {
        e.preventDefault();
        restartAction();
      } else if (e.code === "KeyP" && stateRef.current === "playing") {
        e.preventDefault();
        setIsPaused(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bestScore, isShopOpen, isSettingsOpen, equippedSkin, unlockedSkins, coinsInSession, totalCoins, isPaused, gameState]);

  // Spawns
  const spawnPipe = () => {
    const width = 70;
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

    // Spawn 1 standard gold coin center corridor
    coinsRef.current.push({
      x: 400 + 10 + (width / 2) - 8,
      y: topHeight + (scaledGap / 2),
      radius: 8,
      angle: Math.random() * Math.PI,
      id: "coin_" + Math.random().toString(),
      value: 1,
      collected: false
    });

    // Strategy 2: 25% wave of coins trailing after pipes
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

  const triggerPowerUpBubbleSpawn = () => {
    const bubbleY = 120 + Math.floor(Math.random() * 300);
    const roll = Math.random();
    let type: "invincible" | "turbo" | "magnet" | "slow_mo" | "rainbow" = "magnet";
    
    if (roll < 0.05) {
      type = "rainbow"; 
    } else if (roll < 0.28) {
      type = "invincible";
    } else if (roll < 0.52) {
      type = "turbo";
    } else if (roll < 0.76) {
      type = "slow_mo";
    } else {
      type = "magnet";
    }

    bubblesRef.current.push({
      x: 400 + 12,
      y: bubbleY,
      radius: 14,
      type,
      id: "bubble_" + Math.random().toString(),
      age: 0,
      angle: 0
    });
  };

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

  // Main canvas RAF loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const gameLoop = () => {
      const currentConfig = configRef.current;
      const currentState = stateRef.current;
      const isLoopPaused = pausedRef.current;

      const activeDifficultyLevel = Math.floor(scoreInLoopRef.current / 10) + 1;
      let activeWorldSpeed = currentConfig.gameSpeed + (activeDifficultyLevel - 1) * 0.35;
      
      if (buffsRef.current.slow_mo > 0) {
        activeWorldSpeed *= 0.5;
      }
      if (buffsRef.current.turbo > 0 || buffsRef.current.rainbow > 0) {
        activeWorldSpeed *= 1.8;
      }
      if (activeWorldSpeed > 8.5) activeWorldSpeed = 8.5;

      // 1. UPDATE STATES IF PLAYING & NOT PAUSED
      if (currentState === "playing" && !isLoopPaused) {
        frameCounterRef.current += 1;
        const player = playerRef.current;
        
        if (buffsRef.current.turbo > 0 || buffsRef.current.rainbow > 0) {
          tailLocationsRef.current.push({ x: player.x, y: player.y });
          if (tailLocationsRef.current.length > 5) {
            tailLocationsRef.current.shift();
          }
        } else {
          tailLocationsRef.current = [];
        }

        player.velocity += currentConfig.gravity;
        if (player.velocity > 10.0) player.velocity = 10.0;
        player.y += player.velocity;

        if (onStatsUpdate && frameCounterRef.current % 10 === 0) {
          onStatsUpdate(Math.round(player.y), Number(player.velocity.toFixed(2)));
        }

        if (player.y - player.radius < 0) {
          if (buffsRef.current.invincible > 0 || buffsRef.current.rainbow > 0) {
            player.y = player.radius + 1;
            player.velocity = 0.5;
          } else {
            terminateGame();
          }
        }

        const groundLevel = 600 - 60;
        if (player.y + player.radius > groundLevel) {
          player.y = groundLevel - player.radius;
          player.velocity = 0;
          terminateGame();
        }

        const activeInterval = Math.max(75, currentConfig.pipeInterval - (activeDifficultyLevel - 1) * 6);
        if (frameCounterRef.current % activeInterval === 0) {
          spawnPipe();
        }

        if (bubblesRef.current.length === 0 && activeBuffsList.length === 0) {
          nextPowerUpSpawnRef.current -= 1;
          if (nextPowerUpSpawnRef.current <= 0) {
            triggerPowerUpBubbleSpawn();
            nextPowerUpSpawnRef.current = 600 + Math.floor(Math.random() * 600);
          }
        }

        // Update Bubbles
        const bubbles = bubblesRef.current;
        for (let i = bubbles.length - 1; i >= 0; i--) {
          const b = bubbles[i];
          b.x -= activeWorldSpeed;
          b.age += 1;
          b.angle += 0.04;

          const floatOffset = Math.sin(frameCounterRef.current * 0.06) * 1.5;
          b.y += floatOffset;

          if (frameCounterRef.current % 12 === 0) {
            let sparkColor = "#e0a96d";
            if (b.type === "turbo") sparkColor = "#38bdf8";
            if (b.type === "magnet") sparkColor = "#c084fc";
            if (b.type === "slow_mo") sparkColor = "#4ade80";
            if (b.type === "rainbow") sparkColor = `hsl(${frameCounterRef.current % 360}, 100%, 70%)`;
            spawnSparkle(b.x, b.y, sparkColor);
          }

          if (b.x + b.radius < -20 || b.age > 480) {
            bubbles.splice(i, 1);
            continue;
          }

          const distance = Math.sqrt((player.x - b.x)**2 + (player.y - b.y)**2);
          if (distance < player.radius + b.radius) {
            let popColor = "#eab308";
            let floatingAlert = "INVINCIBLE!";
            let maxFrames = 300; 

            if (b.type === "turbo") {
              popColor = "#3b82f6";
              floatingAlert = "TURBO BOOST!";
              maxFrames = 180;
            }
            if (b.type === "magnet") {
              popColor = "#a855f7";
              floatingAlert = "COIN MAGNET!";
              maxFrames = 360;
            }
            if (b.type === "slow_mo") {
              popColor = "#10b981";
              floatingAlert = "TIME SLOW!";
              maxFrames = 300;
            }
            if (b.type === "rainbow") {
              popColor = "#ec4899";
              floatingAlert = "ULTIMA CORE!";
              maxFrames = 300;
            }

            synthRef.current?.playPowerUp();
            spawnExplosion(b.x, b.y, popColor, 25, 7, 7);
            addFloatingText(b.x, b.y - 12, floatingAlert, popColor, 15);
            setPowerupsCollected(p => p + 1);

            if (b.type === "rainbow") {
              buffsRef.current.rainbow = maxFrames;
              buffsRef.current.invincible = maxFrames;
              buffsRef.current.turbo = maxFrames;
              buffsRef.current.magnet = maxFrames;
            } else {
              buffsRef.current[b.type] = maxFrames;
            }

            bubbles.splice(i, 1);
          }
        }

        // Decay buffs
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
        
        if (JSON.stringify(activeBuffsList) !== JSON.stringify(updatedReactBuffs)) {
          setActiveBuffsList(updatedReactBuffs);
        }

        // Update Coins
        const coins = coinsRef.current;
        for (let i = coins.length - 1; i >= 0; i--) {
          const c = coins[i];
          const hasMagnetActive = buffsRef.current.magnet > 0 || buffsRef.current.rainbow > 0;
          let movedByMagnet = false;

          if (hasMagnetActive) {
            const dx = player.x - c.x;
            const dy = player.y - c.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
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

          c.angle += 0.2;

          if (c.x + c.radius < -20) {
            coins.splice(i, 1);
            continue;
          }

          const distToPlayer = Math.sqrt((player.x - c.x)**2 + (player.y - c.y)**2);
          if (distToPlayer < player.radius + c.radius) {
            c.collected = true;
            synthRef.current?.playCoin();
            spawnExplosion(c.x, c.y, "#ffd700", 8, 3, 3);

            setCoinsInSession((currentCoins) => {
              const newCoinsCount = currentCoins + 1;
              
              setCombo((cStreak) => {
                const nextStreak = cStreak + 1;
                let activeMult = 1;
                
                if (nextStreak >= 10) activeMult = 5;
                else if (nextStreak >= 5) activeMult = 3;
                else if (nextStreak >= 3) activeMult = 2;

                setHighestCombo((h) => Math.max(h, activeMult));
                
                if (activeMult > 1 && nextStreak % 3 === 0) {
                  addFloatingText(c.x, c.y - 12, `COMBO x${activeMult}!`, "#fbbf24", 13);
                }

                return nextStreak;
              });

              return newCoinsCount;
            });

            comboTimerRef.current = 300;

            let activeMulti = 1;
            if (combo >= 10) activeMulti = 5;
            else if (combo >= 5) activeMulti = 3;
            else if (combo >= 3) activeMulti = 2;

            incrementScore(activeMulti);
            coins.splice(i, 1);
          }
        }

        if (comboTimerRef.current > 0) {
          comboTimerRef.current -= 1;
          if (comboTimerRef.current === 0) {
            setCombo(1);
          }
        }

        // Action Pipes
        const pipes = pipesRef.current;
        for (let i = pipes.length - 1; i >= 0; i--) {
          const pipe = pipes[i];
          pipe.x -= activeWorldSpeed;

          if (!pipe.passed && pipe.x + pipe.width < player.x) {
            pipe.passed = true;
            incrementScore(); 
          }

          if (pipe.passed && !pipe.nearMissTriggered) {
            const gapClearanceTop = player.y - pipe.topHeight;
            const gapClearanceBottom = pipe.bottomY - player.y;
            const minimalProximity = Math.min(gapClearanceTop, gapClearanceBottom);

            if (minimalProximity < player.radius + 15 && minimalProximity > 0) {
              pipe.nearMissTriggered = true;
              incrementScore(2);
              addFloatingText(player.x, player.y - 18, "NEAR MISS +2!", "#60a5fa", 13);
              spawnExplosion(player.x, player.y, "#60a5fa", 12, 4, 4);
            }
          }

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

          if (pipe.x + pipe.width < -15) {
            pipes.splice(i, 1);
          }
        }

        // Decay texts
        const floatTexts = floatTextsRef.current;
        for (let i = floatTexts.length - 1; i >= 0; i--) {
          const ft = floatTexts[i];
          ft.y -= 0.8;
          ft.life -= 1;
          if (ft.life <= 0) {
            floatTexts.splice(i, 1);
          }
        }
      }

      // 2. OTHER ACTIVE UPDATES
      // Background particles (Always animate to make screen alive, even in menu!)
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

      // Add peaceful celestial drift background sparkles if in menu
      if (currentState === "idle" && Math.random() < 0.08) {
        particles.push({
          x: Math.random() * 400,
          y: Math.random() * 500,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -Math.random() * 0.6 - 0.1,
          color: "rgba(56,189,248,0.2)",
          size: 1 + Math.random() * 3,
          alpha: 1,
          life: 100 + Math.floor(Math.random() * 100),
          maxLife: 200,
          glow: true
        });
      }

      // 3. CANVAS RENDERING
      ctx.clearRect(0, 0, 400, 600);

      const isTurbo = buffsRef.current.turbo > 0 || buffsRef.current.rainbow > 0;
      ctx.save();
      if (isTurbo && currentState === "playing" && !isLoopPaused) {
        ctx.translate(Math.random() * 4 - 2, Math.random() * 4 - 2);
      }

      // Sky
      if (buffsRef.current.slow_mo > 0) {
        ctx.fillStyle = "#11221e"; 
      } else {
        ctx.fillStyle = "#0c0e18"; 
      }
      ctx.fillRect(0, 0, 400, 600);

      // Parallax Stars
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      const starDrift = (frameCounterRef.current * 0.1) % 400;
      const starDriftFast = (frameCounterRef.current * 0.35) % 400;

      ctx.fillRect((80 - starDrift + 400) % 400, 60, 2, 2);
      ctx.fillRect((340 - starDrift + 400) % 400, 140, 2.5, 2.5);
      ctx.fillRect((210 - starDriftFast + 400) % 400, 250, 1.5, 1.5);
      ctx.fillRect((40 - starDriftFast + 400) % 400, 380, 2, 2);
      ctx.fillRect((270 - starDrift + 400) % 400, 430, 3, 3);

      // Clouds
      ctx.fillStyle = "rgba(255, 255, 255, 0.035)";
      ctx.beginPath();
      ctx.arc((100 - starDrift + 400) % 400, 130, 25, 0, Math.PI * 2);
      ctx.arc((135 - starDrift + 400) % 400, 120, 40, 0, Math.PI * 2);
      ctx.arc((175 - starDrift + 400) % 400, 130, 30, 0, Math.PI * 2);
      ctx.fill();

      // Moon Node
      ctx.beginPath();
      ctx.arc(320, 90, 32, 0, Math.PI * 2);
      ctx.fillStyle = buffsRef.current.slow_mo > 0 ? "#1b2a24" : "#1e243a";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(308, 90, 28, 0, Math.PI * 2);
      ctx.fillStyle = buffsRef.current.slow_mo > 0 ? "#11221e" : "#0c0e18";
      ctx.fill();

      // Pipes
      pipesRef.current.forEach(p => {
        let pipeColor = "#2ec4b6";
        let pipeBorder = "#1f8c82";
        
        if (buffsRef.current.slow_mo > 0) {
          pipeColor = "#10b981"; 
          pipeBorder = "#047857";
        }

        ctx.strokeStyle = pipeBorder;
        ctx.lineWidth = 3;

        ctx.fillStyle = pipeColor;
        ctx.fillRect(p.x, 0, p.width, p.topHeight);
        ctx.strokeRect(p.x, -5, p.width, p.topHeight + 5);

        ctx.fillRect(p.x, p.bottomY, p.width, p.bottomHeight);
        ctx.strokeRect(p.x, p.bottomY, p.width, p.bottomHeight + 5);

        const rimYTop = p.topHeight - 20;
        if (rimYTop >= 0) {
          ctx.fillRect(p.x - 4, rimYTop, p.width + 8, 20);
          ctx.strokeRect(p.x - 4, rimYTop, p.width + 8, 20);
        }

        ctx.fillRect(p.x - 4, p.bottomY, p.width + 8, 20);
        ctx.strokeRect(p.x - 4, p.bottomY, p.width + 8, 20);
      });

      // Coins
      coinsRef.current.forEach(c => {
        const spinWidth = Math.abs(Math.sin(c.angle)) * c.radius * 2;
        ctx.save();
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#fbbf24";
        ctx.strokeStyle = "#b45309";
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.ellipse(c.x, c.y, spinWidth / 2, c.radius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius * 0.3 * Math.abs(Math.sin(c.angle)), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Power-ups
      bubblesRef.current.forEach(b => {
        ctx.save();
        let bubbleColor = "#ffd700";
        ctx.shadowColor = bubbleColor;
        
        if (b.type === "turbo") bubbleColor = "#38bdf8"; 
        if (b.type === "magnet") bubbleColor = "#c084fc"; 
        if (b.type === "slow_mo") bubbleColor = "#4ade80"; 
        if (b.type === "rainbow") {
          bubbleColor = `hsl(${(frameCounterRef.current * 4) % 360}, 100%, 65%)`;
        }

        ctx.shadowBlur = 15;
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

        ctx.fillStyle = bubbleColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 13px Arial";

        let glyph = "🛡️"; 
        if (b.type === "turbo") glyph = "⚡";
        if (b.type === "magnet") glyph = "🧲";
        if (b.type === "slow_mo") glyph = "⏱️";
        if (b.type === "rainbow") glyph = "🌟";

        ctx.fillText(glyph, b.x, b.y);
        ctx.restore();
      });

      // Ground backplane
      ctx.fillStyle = "#0a0c14";
      ctx.fillRect(0, 540, 400, 60);

      ctx.beginPath();
      ctx.moveTo(0, 540);
      ctx.lineTo(400, 540);
      ctx.strokeStyle = buffsRef.current.slow_mo > 0 ? "#10b981" : "#1f8c82";
      ctx.lineWidth = 4;
      ctx.stroke();

      // Particles
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

      // Player
      const p = playerRef.current;

      // Ghosts
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
      
      // Skin coloring
      let playerFill = "#ff9f43"; 
      let playerOutline = "#be5014";
      
      if (equippedSkin === "green") {
        playerFill = "#10b981";
        playerOutline = "#047857";
      } else if (equippedSkin === "purple") {
        playerFill = "#8b5cf6";
        playerOutline = "#5b21b6";
      } else if (equippedSkin === "gold") {
        playerFill = "#fbbf24";
        playerOutline = "#92400e";
      } else if (equippedSkin === "rainbow") {
        playerFill = `hsl(${(frameCounterRef.current * 3.5) % 360}, 100%, 60%)`;
        playerOutline = `hsl(${(frameCounterRef.current * 3.5 + 180) % 360}, 100%, 40%)`;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = playerOutline;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius - 2, 0, Math.PI * 2);
      ctx.fillStyle = playerFill;
      ctx.fill();

      // Shine
      ctx.beginPath();
      ctx.arc(p.x - 4, p.y - 4, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.48)";
      ctx.fill();

      // Shield Aura
      if (buffsRef.current.invincible > 0 || buffsRef.current.rainbow > 0) {
        ctx.strokeStyle = `rgba(250, 204, 21, ${0.4 + Math.sin(frameCounterRef.current * 0.15) * 0.25})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 6 + Math.sin(frameCounterRef.current * 0.1) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Magnet Aura
      if (buffsRef.current.magnet > 0 || buffsRef.current.rainbow > 0) {
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.3 + Math.sin(frameCounterRef.current * 0.1) * 0.15})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Turbo Flame Thrusters
      if (buffsRef.current.turbo > 0 || buffsRef.current.rainbow > 0) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x - p.radius, p.y);
        ctx.lineTo(p.x - p.radius - 12 - Math.random() * 8, p.y);
        ctx.stroke();
      }

      ctx.restore();

      // Floating Texts
      floatTextsRef.current.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = ft.life / ft.maxLife;
        ctx.font = `bold ${ft.size}px monospace`;
        ctx.fillStyle = ft.color;
        ctx.textAlign = "center";
        
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // Shade backdrop overlay on Menu modes
      if (currentState === "idle") {
        ctx.fillStyle = "rgba(6, 8, 16, 0.35)";
        ctx.fillRect(0, 0, 400, 600);
      }

      ctx.restore(); 
      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [gameState, equippedSkin, unlockedSkins, coinsInSession, activeBuffsList, isPaused]);

  return (
    <div className="flex flex-col items-center w-full max-w-md relative select-none">
      
      {/* Dynamic Sound Mute Trigger (Always accessible at top-right or top-left corners) */}
      <div className="absolute top-[-3.5rem] right-0 flex items-center gap-2 z-30">
        <button
          onClick={() => setIsMuted(prev => !prev)}
          className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-gray-300 border border-slate-700/60 shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
          title={isMuted ? "Unmute sounds" : "Mute sounds"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>

      {/* Primary Mobile-App Aspect Screen Frame Block */}
      <div 
        ref={containerRef}
        id="game-viewport-frame"
        onClick={triggerJump}
        className="relative overflow-hidden rounded-[2.5rem] shadow-2xl border-8 border-slate-950 bg-slate-950 select-none cursor-pointer flex flex-col justify-between"
        style={{ width: "100%", aspectRatio: "2/3" }}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          className="absolute inset-0 block w-full h-full object-cover rounded-[1.8rem] z-0 pointer-events-none"
        />

        {/* Vintage glass glare filter */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/5 via-slate-950/0 to-slate-950/40 z-10 rounded-[1.8rem]" />

        {/* ==========================================
            HUD SCREEN OVERLAY: PLAY STATE ACTIVE
            ========================================== */}
        {gameState === "playing" && (
          <div className="absolute inset-0 pointer-events-none p-5 flex flex-col justify-between z-20 select-none">
            
            {/* Top HUD Section */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between w-full">
                
                {/* Top Left: Personal Best Score Badge */}
                <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 rounded-2xl px-3 py-1.5 shadow-md">
                  <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-500/20" />
                  <span className="text-[10px] text-gray-400 font-bold tracking-wider mr-1">BEST:</span>
                  <span className="text-xs font-black text-amber-400 font-mono">{bestScore}</span>
                </div>

                {/* Top Right: Sound/Pause Controller */}
                <div className="flex gap-2 pointer-events-auto">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsPaused(prev => !prev); }}
                    className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800 text-gray-300 transition-all active:scale-90"
                    title={isPaused ? "Resume game" : "Pause game"}
                  >
                    {isPaused ? <Play className="w-4 h-4 fill-emerald-500 text-emerald-500" /> : <span className="text-xs font-black px-1 font-mono">||</span>}
                  </button>
                </div>
              </div>

              {/* Top Center Layout: CURRENT SCORE + POWERUP PROGRESS */}
              <div className="mt-3 flex flex-col items-center justify-center w-full">
                {/* Dynamic animated points score scale */}
                <div className="text-5xl font-black text-white px-6 py-1 select-none font-sans drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)] animate-fade-in flex flex-col items-center">
                  <span>{score}</span>
                </div>

                {/* Coins collection live meter below score */}
                <div className="mt-1 flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/40 px-3 py-1 rounded-full text-amber-400 font-black text-xs shadow-inner">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono text-[13px]">{coinsInSession}</span>
                </div>

                {/* Active Multiplier Streak combo alerts */}
                {combo > 1 && (
                  <div className="mt-2.5 flex items-center gap-1 bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded-full shadow-lg border border-amber-500 text-[10px] animate-bounce">
                    <Flame className="w-3.5 h-3.5 fill-amber-600" />
                    <span>COMBO x{combo >= 10 ? 5 : combo >= 5 ? 3 : 2}!</span>
                  </div>
                )}

                {/* Clean inline power-up countdown timers - Exactly Below Score inside canvas HUD! */}
                {activeBuffsList.length > 0 && (
                  <div className="w-full max-w-[200px] mt-4 flex flex-col gap-1.5 pointer-events-auto">
                    {activeBuffsList.map((buff) => {
                      let color = "bg-yellow-400";
                      let icon = "🛡️";
                      if (buff.type === "turbo") { color = "bg-sky-400 animate-pulse"; icon = "⚡"; }
                      if (buff.type === "magnet") { color = "bg-purple-400"; icon = "🧲"; }
                      if (buff.type === "slow_mo") { color = "bg-emerald-400"; icon = "⏱️"; }
                      if (buff.type === "rainbow") { color = "bg-gradient-to-r from-pink-500 via-sky-400 to-amber-300"; icon = "🌟"; }

                      const widthPercent = (buff.remaining / buff.maxDuration) * 100;

                      return (
                        <div key={buff.type} className="w-full bg-slate-950/80 rounded-full border border-slate-800/50 p-1 flex items-center gap-2">
                          <span className="text-[10px] pl-1.5">{icon}</span>
                          <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden mr-1">
                            <div 
                              className={`h-full ${color} rounded-full transition-all duration-100 ease-linear`}
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom HUD: Tap message */}
            <div className="w-full flex justify-center text-[10px] text-gray-500 font-mono tracking-widest text-center animate-pulse">
              TAP OR SPACE TO FLAP
            </div>
          </div>
        )}

        {/* ==========================================
            HUD PAUSED STATE OVERLAY
            ========================================== */}
        {isPaused && gameState === "playing" && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm p-6 flex flex-col justify-center items-center z-25" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 w-full max-w-[280px] text-center shadow-2xl animate-scale-in">
              <span className="w-10 h-10 rounded-full bg-[#2ec4b6]/10 text-[#2ec4b6] border border-[#2ec4b6]/20 flex items-center justify-center mx-auto mb-2 font-black tracking-widest text-sm">
                ||
              </span>
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">Game Paused</h3>
              <p className="text-xs text-gray-500 mt-1">Ready to jump back into action?</p>

              <button 
                onClick={() => setIsPaused(false)}
                className="w-full mt-5 py-3 rounded-2xl bg-[#2ec4b6] hover:bg-[#20897f] active:scale-95 transition-all text-slate-950 font-black text-xs tracking-wider cursor-pointer"
              >
                RESUME PLAYGAME
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            MAIN MENU / IDLE OVERLAY
            ========================================== */}
        {gameState === "idle" && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c0e18]/80 to-[#07080f]/95 p-6 flex flex-col justify-between items-center z-20" onClick={(e) => e.stopPropagation()}>
            
            {/* Top Vault Header Row: Personal best & Coins */}
            <div className="w-full flex items-center justify-between mt-4">
              {/* PB Trophy */}
              <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 shadow">
                <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-500/20" />
                <span className="text-[9px] text-gray-400 font-bold uppercase mr-0.5">PEAK:</span>
                <span className="text-xs font-black text-amber-400 font-mono">{bestScore}</span>
              </div>
              
              {/* Gold Coins Bank Vault */}
              <div className="flex items-center gap-1.5 bg-slate-905 border border-amber-500/35 rounded-xl px-3 py-1.5 text-amber-400 font-bold text-xs shadow">
                <Coins className="w-3.5 h-3.5 text-[#ffd700] animate-pulse" />
                <span className="font-mono text-sm">{totalCoins}</span>
              </div>
            </div>

            {/* Centered Premium Game Logo & Animated sphere illustration */}
            <div className="flex flex-col items-center gap-2 max-w-[280px]">
              
              {/* Glowing Interactive Bouncing Sphere Bubble illustration */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#ff9f43] to-[#fbbf24] shadow-lg border-2 border-white/40 flex items-center justify-center relative animate-bounce duration-[1500ms]">
                <div className="absolute top-2.5 left-2.5 w-4 h-4 rounded-full bg-white/45" />
                <Sparkles className="w-6 h-6 text-white stroke-1" />
              </div>
              
              <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-sky-400 to-indigo-400 mt-2 hover:scale-105 transition-transform duration-300 select-none">
                FLAPPY BUBBLE
              </h1>
              <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                CORES ADVENTURE
              </p>
            </div>

            {/* Large Bouncing Interactive Play Button & Action grid */}
            <div className="w-full max-w-[290px] flex flex-col gap-3 mb-6">
              
              {/* Primary Pulsating Giant Play Action */}
              <button 
                onClick={triggerJump}
                className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-[#2ec4b6] to-[#38bdf8] hover:brightness-110 active:scale-95 transition-all text-slate-950 font-black text-sm tracking-widest shadow-[0_0_20px_rgba(46,196,182,0.4)] border border-sky-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4.5 h-4.5 fill-slate-950" />
                <span>START RUN GAME</span>
              </button>

              {/* Secondary grids: Shop + Settings */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setIsShopOpen(true)}
                  className="py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-350 font-black text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-800 active:scale-95 transition-all"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-500" />
                  <span>SKINS SHOP</span>
                </button>

                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-350 font-black text-xs tracking-wider flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-800 active:scale-95 transition-all"
                >
                  <Settings className="w-4 h-4 text-indigo-400" />
                  <span>SETTINGS</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ==========================================
            GAME OVER OVERLAY LAYER
            ========================================== */}
        {gameState === "game_over" && (
          <div className="absolute inset-0 bg-slate-950/95 p-6 flex flex-col justify-between items-center z-20" onClick={(e) => e.stopPropagation()}>
            
            {/* Crash Warning Header */}
            <div className="mt-6 flex flex-col items-center select-none text-center">
              <span className="text-[10px] bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold px-2.5 py-1 rounded-full tracking-widest uppercase">
                REACTOR CRASHED
              </span>
              <h2 className="text-3xl font-black text-rose-500 mt-2 uppercase tracking-tight">
                Game Over
              </h2>
            </div>

            {/* Pristine Commercial Mobile App Stats Cards */}
            <div className="w-full max-w-[300px] bg-slate-900/70 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-850 pb-2 text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                <span>Final Mission Summary</span>
                <span className="text-indigo-400 font-mono">ST_99</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-left">
                {/* Score */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Final Score</span>
                  <span className="text-2xl font-black text-white font-mono">{score}</span>
                </div>
                {/* Best Score */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">High Peak</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">{bestScore}</span>
                </div>
                {/* Coins Collected */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Coins Gained</span>
                  <span className="text-lg font-bold text-amber-300 font-mono flex items-center gap-0.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    +{coinsInSession}
                  </span>
                </div>
                {/* Combo Peak */}
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Max Multiplier</span>
                  <span className="text-lg font-bold text-[#38bdf8] font-mono">
                    x{highestCombo}
                  </span>
                </div>
                {/* Powerups Gained */}
                <div className="flex flex-col col-span-2 border-t border-slate-850 pt-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Bubble Cores Popped</span>
                  <span className="text-xs font-semibold text-purple-300 font-mono mt-0.5">
                    {powerupsCollected} active bubble powers gained
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Fast Skin Customizer */}
            <div className="w-full max-w-[300px] bg-slate-900/40 p-2.5 rounded-2xl border border-slate-800 flex flex-col gap-1.5 select-none">
              <div className="flex justify-between items-center text-[9px] text-gray-500 font-bold uppercase px-1">
                <span>Equip Skin</span>
                <span className="text-amber-400 font-mono flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5">
                  <Coins className="w-2.5 h-2.5" />
                  {totalCoins}
                </span>
              </div>
              <div className="flex gap-2 justify-center py-1">
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
                      className={`w-7 h-7 rounded-full ${clr} border transition-all text-[8px] flex items-center justify-center font-bold text-white relative hover:scale-105 ${equippedSkin === s ? "border-white ring-2 ring-indigo-500/40 scale-110 shadow-lg" : "border-transparent opacity-65 hover:opacity-100"}`}
                    >
                      {!isUnlocked && <span className="absolute text-[8px] bottom-[-2px] right-[-2px]">🔒</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action buttons list */}
            <div className="w-full max-w-[300px] flex flex-col gap-2.5 mb-6">
              <button 
                onClick={restartAction}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#2ec4b6] to-[#38bdf8] hover:brightness-110 transition-colors text-slate-950 font-black text-xs tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                <span>PLAY AGAIN</span>
              </button>
              
              <div className="grid grid-cols-2 gap-2.5">
                <button 
                  onClick={() => setGameState("idle")}
                  className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 transition-colors text-slate-300 font-bold text-xs tracking-wider flex items-center justify-center gap-1 cursor-pointer border border-slate-800"
                >
                  <Home className="w-4 h-4 text-gray-400" />
                  <span>MAIN MENU</span>
                </button>
                <button 
                  onClick={() => setIsShopOpen(true)}
                  className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 transition-all text-slate-300 font-bold text-xs tracking-wider flex items-center justify-center gap-1 cursor-pointer border border-slate-800"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-500" />
                  <span>SKINS SHOP</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            COSMETIC SHOP OVERLAY DIALOG
            ========================================== */}
        {isShopOpen && (
          <div className="absolute inset-0 bg-slate-950/98 p-6 flex flex-col justify-between items-center z-30 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            
            <div className="w-full flex items-center justify-between border-b border-slate-850 pb-3 mt-4">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1 uppercase tracking-wider">
                <ShoppingBag className="w-4 h-4 text-amber-500 animate-bounce" />
                <span>COSMETIC SKINS</span>
              </span>
              <span className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1 text-xs font-bold text-amber-400 flex items-center gap-1 shadow-inner">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                {totalCoins} COINS
              </span>
            </div>

            {/* Skins Listing Row Grid */}
            <div className="flex-1 overflow-y-auto w-full py-4 space-y-3 max-h-[360px] pr-1 mt-1 scrollbar-thin">
              {[
                { id: "orange", name: "Classic Orange", cost: 0, color: "bg-[#ff9f43]", d: "Standard issue spherical bubble frame." },
                { id: "green", name: "Emerald Cyber", cost: 25, color: "bg-[#10b981]", d: "Carbon composition matrix shell shield." },
                { id: "purple", name: "Nebula Pulsar", cost: 50, color: "bg-[#8b5cf6]", d: "Gravity engine core fitted with pulsar exhaust." },
                { id: "gold", name: "Luxe Gilded", cost: 100, color: "bg-[#fbbf24]", d: "Pure golden composite casing shines premium sparks." },
                { id: "rainbow", name: "Rainbow Spectrum", cost: 150, color: "bg-gradient-to-tr from-rose-500 via-sky-400 to-amber-300", d: "Experimental spectrum reactor shell with speed trails." },
              ].map((skin) => {
                const isUnlocked = unlockedSkins.includes(skin.id);
                const isEquipped = equippedSkin === skin.id;

                return (
                  <div key={skin.id} className="bg-slate-900 border border-slate-850 rounded-2xl p-3 flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-full ${skin.color} shadow-inner border border-white/20`} />
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-extrabold text-white capitalize">{skin.name}</span>
                        <p className="text-[9.5px] text-gray-500 leading-tight max-w-[140px] mt-0.5">{skin.d}</p>
                      </div>
                    </div>
                    
                    <div>
                      {isEquipped ? (
                        <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/40 text-indigo-400 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                          Armed
                        </span>
                      ) : isUnlocked ? (
                        <button 
                          onClick={() => equipSkin(skin.id)}
                          className="bg-[#24252a] hover:bg-slate-805 text-[10px] text-white font-extrabold px-3 py-1.5 rounded-xl cursor-pointer transition-colors border border-slate-800"
                        >
                          EQUIP
                        </button>
                      ) : (
                        <button 
                          onClick={() => buySkin(skin.id, skin.cost)}
                          disabled={totalCoins < skin.cost}
                          className={`flex items-center gap-1 border text-[10px] font-black px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer ${totalCoins >= skin.cost ? "bg-amber-500 text-slate-950 border-amber-400 hover:brightness-110" : "bg-slate-950 border-slate-900 text-gray-600 cursor-not-allowed"}`}
                        >
                          <Coins className="w-3 h-3" />
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
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 text-gray-300 font-bold text-xs tracking-widest cursor-pointer border border-slate-800 mt-2 hover:text-white transition-all uppercase"
            >
              Back to Game
            </button>
          </div>
        )}

        {/* ==========================================
            SETTINGS MENU OVERLAY
            ========================================== */}
        {isSettingsOpen && (
          <div className="absolute inset-0 bg-slate-950/98 p-6 flex flex-col justify-between items-center z-30 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            
            <div className="w-full flex items-center justify-between border-b border-slate-850 pb-3 mt-4">
              <span className="text-xs font-black text-indigo-400 flex items-center gap-1 uppercase tracking-wider">
                <Settings className="w-4 h-4 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>SETTINGS & CONFIG</span>
              </span>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Settings Options list */}
            <div className="flex-1 w-full py-6 space-y-5 text-left text-sans max-h-[380px] overflow-y-auto">
              
              {/* Option 1: Double Audio controls */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Audio Synth System</span>
                <button 
                  onClick={() => setIsMuted(prev => !prev)}
                  className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-850 flex items-center justify-between hover:bg-slate-850 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                    <span className="text-xs font-bold text-white">Interactive 8-Bit Synth Sounds</span>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${isMuted ? "bg-rose-500/10 text-rose-400 border border-rose-500/35" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/35"}`}>
                    {isMuted ? "MUTED" : "ENABLED"}
                  </span>
                </button>
              </div>

              {/* Option 2: Active Instructions Guide */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">How to Play Guide</span>
                <div className="p-4 rounded-x bg-slate-900 border border-slate-850 rounded-2xl text-[11px] leading-relaxed text-gray-400 space-y-2 select-text">
                  <div className="flex items-center gap-1.5 text-white font-bold text-xs mb-1">
                    <Info className="w-3.5 h-3.5 text-sky-400" />
                    <span>Control Directives</span>
                  </div>
                  <p>
                    Tap anywhere on the game screen, or press <kbd className="px-1 py-0.5 bg-slate-950 border border-slate-800 text-white text-[9px] rounded">SPACEBAR</kbd> / <kbd className="px-1 py-0.5 bg-slate-950 border border-slate-800 text-white text-[9px] rounded">ARROW UPs</kbd> to jump and flap coordinates.
                  </p>
                  <p>
                    Pass safely through the corridors to gain points. Collect floating glowing bubbles to unlock timed special modifiers, magnetize gold coins, slow time down, or become invulnerable!
                  </p>
                </div>
              </div>

              {/* Option 3: Reset diagnostics */}
              <div className="space-y-2 border-t border-slate-850 pt-4">
                <span className="text-[10px] text-rose-450 font-bold uppercase tracking-wider block">Destructive Actions</span>
                <button 
                  onClick={resetAllProgress}
                  className="w-full py-3 rounded-2xl bg-rose-550/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500 hover:text-slate-950 font-black text-xs tracking-wider transition-all cursor-pointer text-center"
                >
                  FULL ERASE SAVE DATA
                </button>
              </div>
            </div>

            {/* Back action */}
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="w-full py-3.5 rounded-2xl bg-[#030409] hover:bg-slate-900 text-gray-300 font-bold text-xs tracking-widest cursor-pointer border border-slate-800 mt-2 uppercase transition-all"
            >
              CLOSE SETTINGS
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
