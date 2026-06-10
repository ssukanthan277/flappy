export interface GameConfig {
  gravity: number;
  jumpForce: number;
  gameSpeed: number;
  pipeGap: number;
  pipeInterval: number; // in frames
}

export const defaultConfig: GameConfig = {
  gravity: 0.5,
  jumpForce: -8.0,
  gameSpeed: 3.0,
  pipeGap: 140,
  pipeInterval: 100,
};

export function generatePygameCode(config: GameConfig): string {
  // Format variables beautifully
  const g = config.gravity.toFixed(2);
  const jf = config.jumpForce.toFixed(2);
  const gs = config.gameSpeed.toFixed(2);
  const gap = Math.round(config.pipeGap);
  const interval = Math.round(config.pipeInterval);

  return `"""
Pygame Flappy Bubble - Object-Oriented Single File Mobile-Polished Edition
Target Python: 3.11+
Dependency: pygame>=2.5.0

Controls:
  - SPACE: Jump / Flap
  - R: Restart on Game Over
  - ESC/Close: Exit Game
"""

import sys
import math
import random
import pygame

# ==========================================
# GAME CONSTANTS & CONFIGURATION
# ==========================================
SCREEN_WIDTH = 400
SCREEN_HEIGHT = 600
FPS = 60

# Physical settings synchronized from the Web Workbench sliders:
GRAVITY = ${g}         # Downward acceleration rate
JUMP_FORCE = ${jf}     # Upward thrust speed when SPACE is tapped
GAME_SPEED = ${gs}     # Scroll rate of obstacles (pixels per frame)
PIPE_GAP = ${gap}         # Size of the vertical opening between obstacles
PIPE_INTERVAL = ${interval}   # Spacing between obstacle spawns (frames)

# Colors definitions (RGB representational tuples)
COLOR_SKY = (24, 28, 41)         # Deep indigo space/sky tone
COLOR_PIPE = (46, 196, 182)      # Cyber teal pipe accent
COLOR_PIPE_DARK = (32, 137, 127) # Shadow outline for pipes
COLOR_PLAYER = (255, 159, 67)    # Golden orange circular agent
COLOR_GROUND = (17, 20, 34)       # Dark ground platform
COLOR_WHITE = (255, 255, 255)    # Text color
COLOR_MUTED = (140, 150, 175)    # Secondary label text

# Buff Colors
COLOR_YELLOW = (251, 191, 36)
COLOR_BLUE = (56, 189, 248)
COLOR_PURPLE = (168, 85, 247)
COLOR_GREEN = (16, 185, 129)
COLOR_PINK = (236, 72, 153)

# ==========================================
# REUSABLE SIMULATION ENTITIES
# ==========================================

class Particle:
    """
    Handles retro block-sparks particles with age decay in game frame steps.
    """
    def __init__(self, x, y, color):
        self.x = x
        self.y = y
        self.color = color
        angle = random.uniform(0, 2 * math.pi)
        speed = random.uniform(1.0, 5.0)
        self.vx = math.cos(angle) * speed
        self.vy = math.sin(angle) * speed - random.uniform(0.5, 1.5)
        self.size = random.uniform(2, 5)
        self.life = random.randint(20, 40)
        self.max_life = self.life

    def update(self):
        self.x += self.vx
        self.y += self.vy
        self.life -= 1

    def draw(self, screen):
        if self.life > 0:
            alpha = int((self.life / self.max_life) * 255)
            # Create surf with alpha path support
            p_surf = pygame.Surface((int(self.size * 2), int(self.size * 2)), pygame.SRCALPHA)
            pygame.draw.circle(p_surf, self.color + (alpha,), (int(self.size), int(self.size)), int(self.size))
            screen.blit(p_surf, (int(self.x - self.size), int(self.y - self.size)))


class FloatingText:
    """
    Popup texts showing score, combos, and bubble names drifting upwards.
    """
    def __init__(self, x, y, text, color, size=14):
        self.x = x
        self.y = y
        self.text = text
        self.color = color
        self.life = 45
        self.max_life = 45
        self.font = pygame.font.SysFont("Arial", size, bold=True)

    def update(self):
        self.y -= 0.8
        self.life -= 1

    def draw(self, screen):
        if self.life > 0:
            alpha = int((self.life / self.max_life) * 255)
            # Create transparent blitting surface
            label = self.font.render(self.text, True, self.color)
            label_alpha = label.copy()
            label_alpha.fill((255, 255, 255, alpha), special_flags=pygame.BLEND_RGBA_MULT)
            rect = label_alpha.get_rect(center=(int(self.x), int(self.y)))
            screen.blit(label_alpha, rect)


class Player:
    """
    Represents the player ball controlled by user SPACE triggers, featuring skin rendering and trails.
    """
    def __init__(self):
        self.radius = 16
        self.x = 80
        self.y = SCREEN_HEIGHT // 2
        self.velocity = 0.0
        self.max_fall_speed = 10.0
        
        # Power-up frame counters
        self.invincible_timer = 0
        self.turbo_timer = 0
        self.magnet_timer = 0
        self.slow_mo_timer = 0
        self.rainbow_timer = 0
        
        # Tail tracking for speed trial ghosting effects
        self.trail = []

    def jump(self):
        self.velocity = JUMP_FORCE

    def update(self):
        self.velocity += GRAVITY
        if self.velocity > self.max_fall_speed:
            self.velocity = self.max_fall_speed
            
        self.y += int(self.velocity)
        
        # Ground clamping boundary check
        ground_level = SCREEN_HEIGHT - 60
        if self.y + self.radius > ground_level:
            self.y = ground_level - self.radius
            self.velocity = 0

        # Maintain Speed Trails arrays
        if self.turbo_timer > 0 or self.rainbow_timer > 0:
            self.trail.append((self.x, self.y))
            if len(self.trail) > 5:
                self.trail.pop(0)
        else:
            self.trail.clear()

        # Countdowns
        if self.invincible_timer > 0: self.invincible_timer -= 1
        if self.turbo_timer > 0: self.turbo_timer -= 1
        if self.magnet_timer > 0: self.magnet_timer -= 1
        if self.slow_mo_timer > 0: self.slow_mo_timer -= 1
        if self.rainbow_timer > 0: self.rainbow_timer -= 1

    def draw(self, screen, frame_counter, skin_type="orange"):
        # Draw tail ghosts
        for idx, pos in enumerate(self.trail):
            alpha = int((idx + 1) * 35)
            trail_surf = pygame.Surface((self.radius * 2, self.radius * 2), pygame.SRCALPHA)
            pygame.draw.circle(trail_surf, (56, 189, 248, alpha), (self.radius, self.radius), self.radius - 2)
            screen.blit(trail_surf, (pos[0] - self.radius, pos[1] - self.radius))

        # Determine skin colors based on selection matches
        fill_color = COLOR_PLAYER
        outline_color = (190, 80, 20)

        if skin_type == "green":
            fill_color = (16, 185, 129)
            outline_color = (4, 120, 87)
        elif skin_type == "purple":
            fill_color = (139, 92, 246)
            outline_color = (91, 33, 182)
        elif skin_type == "gold":
            fill_color = (245, 158, 11)
            outline_color = (146, 64, 14)
        elif skin_type == "rainbow":
            hue = (frame_counter * 4) % 360
            # Rough hsv conversion
            v = 230
            s = 240
            c = s * v / 255
            x = c * (1 - abs((hue / 60.0) % 2 - 1))
            rgb = [0, 0, 0]
            if hue < 60: rgb = [c, x, 0]
            elif hue < 120: rgb = [x, c, 0]
            elif hue < 180: rgb = [0, c, x]
            elif hue < 240: rgb = [0, x, c]
            elif hue < 300: rgb = [x, 0, c]
            else: rgb = [c, 0, x]
            fill_color = (int(rgb[0] + 15), int(rgb[1] + 15), int(rgb[2] + 15))
            outline_color = (60, 60, 60)

        # Draw main sphere body shadow
        pygame.draw.circle(screen, outline_color, (self.x, self.y), self.radius)
        # Draw body
        pygame.draw.circle(screen, fill_color, (self.x, self.y), self.radius - 2)
        # Render gloss shine element
        pygame.draw.circle(screen, (255, 255, 255, 100), (self.x - 4, self.y - 4), 4)

        # Invincibility shield halo
        if self.invincible_timer > 0 or self.rainbow_timer > 0:
            scale = 6 + int(math.sin(frame_counter * 0.15) * 3)
            shield_surf = pygame.Surface(((self.radius + scale) * 2, (self.radius + scale) * 2), pygame.SRCALPHA)
            pygame.draw.circle(shield_surf, COLOR_YELLOW + (110,), (self.radius + scale, self.radius + scale), self.radius + scale, 3)
            screen.blit(shield_surf, (self.x - self.radius - scale, self.y - self.radius - scale))

        # Magnetizer sphere waves
        if self.magnet_timer > 0 or self.rainbow_timer > 0:
            radius_mag = self.radius + 12
            poly_surf = pygame.Surface((radius_mag * 2, radius_mag * 2), pygame.SRCALPHA)
            pygame.draw.circle(poly_surf, COLOR_PURPLE + (70,), (radius_mag, radius_mag), radius_mag, 2)
            screen.blit(poly_surf, (self.x - radius_mag, self.y - radius_mag))


class Pipe:
    """
    Cyber teal columns spawning at random height corridors.
    """
    def __init__(self, x, current_difficulty_level):
        self.x = x
        self.width = 70
        self.passed = False
        self.near_miss_triggered = False

        # Narrowing slot gaps based on dynamic leveling tiers
        scaled_gap = max(105, PIPE_GAP - (current_difficulty_level - 1) * 6)
        self.gap_height = scaled_gap
        
        min_pipe_height = 50
        max_pipe_height = SCREEN_HEIGHT - 60 - self.gap_height - min_pipe_height
        self.top_height = random.randint(min_pipe_height, max_pipe_height)
        
        self.bottom_y = self.top_height + self.gap_height
        self.bottom_height = SCREEN_HEIGHT - 60 - self.bottom_y

    def update(self, speed):
        self.x -= speed

    def draw(self, screen, in_slow_time=False):
        color = COLOR_PIPE
        border_color = COLOR_PIPE_DARK
        
        if in_slow_time:
            color = COLOR_GREEN
            border_color = (4, 120, 87)

        # Top column rect
        top_rect = pygame.Rect(int(self.x), 0, self.width, self.top_height)
        pygame.draw.rect(screen, color, top_rect)
        pygame.draw.rect(screen, border_color, top_rect, 3)
        
        # Top Rim indicator
        rim_y_top = self.top_height - 20
        if rim_y_top >= 0:
            pygame.draw.rect(screen, color, (int(self.x) - 4, rim_y_top, self.width + 8, 20))
            pygame.draw.rect(screen, border_color, (int(self.x) - 4, rim_y_top, self.width + 8, 20), 3)

        # Bottom column rect
        bottom_rect = pygame.Rect(int(self.x), self.bottom_y, self.width, self.bottom_height)
        pygame.draw.rect(screen, color, bottom_rect)
        pygame.draw.rect(screen, border_color, bottom_rect, 3)
        
        # Bottom Rim indicator
        pygame.draw.rect(screen, color, (int(self.x) - 4, self.bottom_y, self.width + 8, 20))
        pygame.draw.rect(screen, border_color, (int(self.x) - 4, self.bottom_y, self.width + 8, 20), 3)

    def collides_with_player(self, player):
        # Circle rectangle intersections
        top_rect = pygame.Rect(int(self.x), 0, self.width, self.top_height)
        bottom_rect = pygame.Rect(int(self.x), self.bottom_y, self.width, self.bottom_height)

        def check_rect_overlap(rect):
            closest_x = max(rect.left, min(player.x, rect.right))
            closest_y = max(rect.top, min(player.y, rect.bottom))
            dx = player.x - closest_x
            dy = player.y - closest_y
            return (dx ** 2 + dy ** 2) < (player.radius ** 2)

        return check_rect_overlap(top_rect) or check_rect_overlap(bottom_rect)


class Coin:
    """
    Animated gold coins pulling gracefully toward the player under magnet force.
    """
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.radius = 8
        self.angle = random.uniform(0, 3.14)
        self.collected = False

    def update(self, speed, player, magnet_active):
        if magnet_active:
            dx = player.x - self.x
            dy = player.y - self.y
            dist = math.sqrt(dx*dx + dy*dy)
            
            # Attracted within 160px vector range
            if dist < 160:
                pull_speed = 4.5 + (160 - dist) * 0.08
                self.x += (dx / dist) * pull_speed
                self.y += (dy / dist) * pull_speed
                return
                
        self.x -= speed
        self.angle += 0.18

    def draw(self, screen):
        spin_width = int(abs(math.sin(self.angle)) * self.radius * 2)
        if spin_width < 1: spin_width = 1
        
        # Draw gold ellipse surface
        coin_surf = pygame.Surface((int(self.radius * 2), int(self.radius * 2)), pygame.SRCALPHA)
        pygame.draw.ellipse(coin_surf, (251, 191, 36), (int(self.radius - spin_width/2), 0, spin_width, int(self.radius * 2)))
        pygame.draw.ellipse(coin_surf, (180, 83, 9), (int(self.radius - spin_width/2), 0, spin_width, int(self.radius * 2)), 1)
        screen.blit(coin_surf, (int(self.x - self.radius), int(self.y - self.radius)))


class PowerUpBubble:
    """
    Floating customizable powerups bubbles drifting inside strategic skies.
    """
    def __init__(self, type_name):
        self.x = SCREEN_WIDTH + 14
        self.y = random.randint(120, 420)
        self.radius = 14
        self.type = type_name
        self.age = 0
        self.angle = 0.0

    def update(self, speed):
        self.x -= speed
        self.age += 1
        self.angle += 0.05
        # Float up & down sinusoidal offsets
        self.y += math.sin(self.age * 0.06) * 1.5

    def draw(self, screen, frame_counter):
        color = COLOR_YELLOW
        glyph = "P" # symbol placeholder

        if self.type == "turbo":
            color = COLOR_BLUE
            glyph = "T"
        elif self.type == "magnet":
            color = COLOR_PURPLE
            glyph = "M"
        elif self.type == "slow_mo":
            color = COLOR_GREEN
            glyph = "S"
        elif self.type == "rainbow":
            hue = (frame_counter * 5) % 360
            color = COLOR_PINK
            glyph = "R"

        # Double outer glowing orbits
        bubble_surf = pygame.Surface((self.radius * 2 + 10, self.radius * 2 + 10), pygame.SRCALPHA)
        pygame.draw.circle(bubble_surf, color + (80,), (self.radius + 5, self.radius + 5), self.radius, 2)
        pygame.draw.circle(bubble_surf, (255, 255, 255, 120), (self.radius + 3, self.radius + 3), self.radius - 3, 1)
        screen.blit(bubble_surf, (int(self.x - self.radius - 5), int(self.y - self.radius - 5)))

        # Center glyph indicator
        font = pygame.font.SysFont("Arial", 11, bold=True)
        lbl = font.render(glyph, True, color)
        rect = lbl.get_rect(center=(int(self.x), int(self.y)))
        screen.blit(lbl, rect)


# ==========================================
# CENTRAL COMPILER GAME RUNNER
# ==========================================

class Game:
    """
    Orchestrates screen init, inputs tracking, layout updates, collisions and game states.
    """
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Pygame Flappy Bubble Sandbox")
        self.clock = pygame.time.Clock()
        self.font_main = pygame.font.SysFont("Arial", 28, bold=True)
        self.font_sub = pygame.font.SysFont("Arial", 16)
        self.font_mini = pygame.font.SysFont("Arial", 11, bold=True)
        
        # Scoring metrics & persistence
        self.score = 0
        self.high_score = 0
        self.total_coins = 0
        
        # Session records
        self.coins_session = 0
        self.combo = 1
        self.combo_timer = 0
        self.highest_combo = 1
        self.powerups_collected = 0
        
        # Menu state controls
        self.state = "idle" # "idle", "playing", "game_over"
        self.equipped_skin = "orange"
        
        self.reset_game()

    def reset_game(self):
        self.player = Player()
        self.pipes = []
        self.coins = []
        self.bubbles = []
        self.particles = []
        self.float_texts = []
        
        self.frame_counter = 0
        self.next_powerup_spawn_cooldown = 400 + random.randint(0, 400)
        
        self.score = 0
        self.coins_session = 0
        self.combo = 1
        self.combo_timer = 0
        self.highest_combo = 1
        self.powerups_collected = 0

    def spawn_pipe(self):
        level = max(1, self.score // 10 + 1)
        self.pipes.append(Pipe(SCREEN_WIDTH + 10, level))
        
        # Spawn gold coin node exactly center inside the gap corridor
        scaled_gap = max(105, PIPE_GAP - (level - 1) * 6)
        self.coins.append(Coin(SCREEN_WIDTH + 10 + 35, self.pipes[-1].top_height + (scaled_gap // 2)))

    def trigger_powerup_bubble(self):
        types = ["invincible", "turbo", "magnet", "slow_mo"]
        roll = random.random()
        
        if roll < 0.05:
            ptype = "rainbow"
        else:
            ptype = random.choice(types)
            
        self.bubbles.append(PowerUpBubble(ptype))

    def trigger_explosion_particles(self, x, y, color, count=15):
        for _ in range(count):
            self.particles.append(Particle(x, y, color))

    def run(self):
        running = True
        while running:
            self.clock.tick(FPS)
            self.frame_counter += 1

            # Event listeners
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        running = False
                    elif event.key == pygame.K_SPACE or event.key == pygame.K_UP:
                        if self.state == "idle":
                            self.reset_game()
                            self.state = "playing"
                            self.player.jump()
                        elif self.state == "playing":
                            self.player.jump()
                    elif event.key == pygame.K_r:
                        if self.state == "game_over":
                            self.reset_game()
                            self.state = "playing"
                    
                    # Keyboard selection skin triggers inside launcher
                    elif event.key == pygame.K_1 and self.state == "idle":
                        self.equipped_skin = "orange"
                    elif event.key == pygame.K_2 and self.state == "idle":
                        self.equipped_skin = "green"
                    elif event.key == pygame.K_3 and self.state == "idle":
                        self.equipped_skin = "purple"
                    elif event.key == pygame.K_4 and self.state == "idle":
                        self.equipped_skin = "gold"
                    elif event.key == pygame.K_5 and self.state == "idle":
                        self.equipped_skin = "rainbow"

            # --- ACTIVE TIMED UPDATE LOGIC ---
            if self.state == "playing":
                # Determine environmental variables based on score difficulty curve
                active_level = max(1, self.score // 10 + 1)
                active_speed = GAME_SPEED + (active_level - 1) * 0.35
                
                # Check active buff modifiers
                in_slow_mo = self.player.slow_mo_timer > 0 or self.player.rainbow_timer > 0
                in_turbo = self.player.turbo_timer > 0 or self.player.rainbow_timer > 0
                is_invincible = self.player.invincible_timer > 0 or self.player.rainbow_timer > 0
                is_magnet = self.player.magnet_timer > 0 or self.player.rainbow_timer > 0

                if in_slow_mo:
                    active_speed *= 0.5
                if in_turbo:
                    active_speed *= 1.8
                if active_speed > 8.5: active_speed = 8.5

                # Update physics
                self.player.update()

                # Pipe spawning intervals
                active_interval = max(75, PIPE_INTERVAL - (active_level - 1) * 6)
                if self.frame_counter % active_interval == 0:
                    self.spawn_pipe()

                # Powerup Spawn manager cooldown checking
                if len(self.bubbles) == 0 and self.player.rainbow_timer == 0:
                    self.next_powerup_spawn_cooldown -= 1
                    if self.next_powerup_spawn_cooldown <= 0:
                        self.trigger_powerup_bubble()
                        self.next_powerup_spawn_cooldown = 600 + random.randint(0, 600)

                # Process particles
                for pt in self.particles[:]:
                    pt.update()
                    if pt.life <= 0:
                        self.particles.remove(pt)

                # Process popup texts
                for ft in self.float_texts[:]:
                    ft.update()
                    if ft.life <= 0:
                        self.float_texts.remove(ft)

                # Process bubbles
                for b in self.bubbles[:]:
                    b.update(active_speed)
                    
                    if b.x + b.radius < -20 or b.age > 480:
                        self.bubbles.remove(b)
                        continue

                    # Bubble captures
                    dx = self.player.x - b.x
                    dy = self.player.y - b.y
                    dist = math.sqrt(dx*dx + dy*dy)
                    if dist < self.player.radius + b.radius:
                        # Popped!
                        popColor = COLOR_YELLOW
                        titleLabel = "INVINCIBLE!"
                        frames = 300 # 5s
                        
                        if b.type == "turbo":
                            popColor = COLOR_BLUE
                            titleLabel = "TURBO BOOST!"
                            frames = 180 # 3s
                        elif b.type == "magnet":
                            popColor = COLOR_PURPLE
                            titleLabel = "COIN MAGNET!"
                            frames = 360 # 6s
                        elif b.type == "slow_mo":
                            popColor = COLOR_GREEN
                            titleLabel = "TIME SLOW!"
                            frames = 300 # 5s
                        elif b.type == "rainbow":
                            popColor = COLOR_PINK
                            titleLabel = "ULTIMATE SPEED!"
                            frames = 300 # 5s

                        self.trigger_explosion_particles(b.x, b.y, popColor, 30)
                        self.float_texts.append(FloatingText(b.x, b.y, titleLabel, popColor, 15))
                        self.powerups_collected += 1

                        if b.type == "rainbow":
                            self.player.rainbow_timer = frames
                            self.player.invincible_timer = frames
                            self.player.turbo_timer = frames
                            self.player.magnet_timer = frames
                        else:
                            setattr(self.player, b.type + "_timer", frames)

                        self.bubbles.remove(b)

                # Process coins
                for c in self.coins[:]:
                    c.update(active_speed, self.player, is_magnet)
                    if c.x + c.radius < -20:
                        self.coins.remove(c)
                        continue

                    # Capture coin
                    dx = self.player.x - c.x
                    dy = self.player.y - c.y
                    dist = math.sqrt(dx*dx + dy*dy)
                    if dist < self.player.radius + c.radius:
                        # Collected!
                        self.trigger_explosion_particles(c.x, c.y, COLOR_YELLOW, 8)
                        self.coins_session += 1
                        
                        # Increment streaks combos
                        self.combo += 1
                        self.combo_timer = 300
                        mult = 1
                        if self.combo >= 10: mult = 5
                        elif self.combo >= 5: mult = 3
                        elif self.combo >= 3: mult = 2
                        
                        if mult > self.highest_combo:
                            self.highest_combo = mult

                        self.score += mult
                        if self.score > self.high_score:
                            self.high_score = self.score

                        self.coins.remove(c)

                # Combo decay timers ticking down
                if self.combo_timer > 0:
                    self.combo_timer -= 1
                    if self.combo_timer == 0:
                        self.combo = 1

                # Process solid columns
                for pipe in self.pipes[:]:
                    pipe.update(active_speed)

                    if not pipe.passed and pipe.x + pipe.width < self.player.x:
                        pipe.passed = True
                        self.score += 1
                        if self.score > self.high_score:
                            self.high_score = self.score

                    # Proximity Near Miss detection checks
                    if pipe.passed and not pipe.near_miss_triggered:
                        gap_clear_top = self.player.y - pipe.top_height
                        gap_clear_bottom = pipe.bottom_y - self.player.y
                        minimal_proximity = min(gap_clear_top, gap_clear_bottom)
                        
                        if minimal_proximity < self.player.radius + 15 and minimal_proximity > 0:
                            pipe.near_miss_triggered = True
                            self.score += 2
                            if self.score > self.high_score:
                                self.high_score = self.score
                            self.float_texts.append(FloatingText(self.player.x, self.player.y - 15, "NEAR MISS +2!", COLOR_BLUE, 13))
                            self.trigger_explosion_particles(self.player.x, self.player.y, COLOR_BLUE, 10)

                    # Collision testing
                    if not (is_invincible or in_turbo):
                        if pipe.collides_with_player(self.player):
                            self.state = "game_over"
                            self.total_coins += self.coins_session

                    if pipe.x + pipe.width < -15:
                        self.pipes.remove(pipe)

                # Sky and ground boundaries checking
                if self.player.y - self.player.radius <= 0:
                    if not (is_invincible or in_turbo):
                        self.state = "game_over"
                        self.total_coins += self.coins_session

                ground_level = SCREEN_HEIGHT - 60
                if self.player.y + self.player.radius >= ground_level - 2:
                    if not (is_invincible or in_turbo):
                        self.state = "game_over"
                        self.total_coins += self.coins_session

            # --- FRAME RENDERING ---
            # Fill backplane
            in_slow_mo = self.state == "playing" and (self.player.slow_mo_timer > 0 or self.player.rainbow_timer > 0)
            if in_slow_mo:
                self.screen.fill((18, 38, 30)) # emerald slow sky
            else:
                self.screen.fill(COLOR_SKY)

            # Draw static sky circles shadow
            pygame.draw.circle(self.screen, (34, 40, 58), (320, 100), 40)
            pygame.draw.circle(self.screen, (18, 16, 29) if not in_slow_mo else (18, 38, 30), (305, 100), 35)

            # Draw obstacles & coins
            for pipe in self.pipes:
                pipe.draw(self.screen, in_slow_mo)
            for coin in self.coins:
                coin.draw(self.screen)
            for b in self.bubbles:
                b.draw(self.screen, self.frame_counter)
            for pt in self.particles:
                pt.draw(self.screen)
            for ft in self.float_texts:
                ft.draw(self.screen)

            # Draw ground overlay anchor
            pygame.draw.rect(self.screen, COLOR_GROUND, (0, SCREEN_HEIGHT - 60, SCREEN_WIDTH, 60))
            pygame.draw.line(self.screen, COLOR_PIPE_DARK, (0, SCREEN_HEIGHT - 60), (SCREEN_WIDTH, SCREEN_HEIGHT - 60), 3)

            # Draw player circle
            self.player.draw(self.screen, self.frame_counter, self.equipped_skin)

            # Overlay HUD status indicators on screen
            if self.state == "playing":
                # Centered running points
                score_surface = self.font_main.render(str(self.score), True, COLOR_WHITE)
                rect_score = score_surface.get_rect(center=(SCREEN_WIDTH // 2, 70))
                self.screen.blit(score_surface, rect_score)

                # Coins Count on HUD top-right
                coin_lbl = self.font_sub.render(f"Coins: {self.coins_session}", True, COLOR_YELLOW)
                self.screen.blit(coin_lbl, (SCREEN_WIDTH - 90, 20))

                # Combos status HUD top-left
                if self.combo > 1:
                    mult = 2
                    if self.combo >= 10: mult = 5
                    elif self.combo >= 5: mult = 3
                    combo_lbl = self.font_mini.render(f"COMBO x{mult}!", True, COLOR_YELLOW)
                    self.screen.blit(combo_lbl, (20, 20))

            elif self.state == "idle":
                # Start screen overlay
                overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
                overlay.fill((10, 12, 18, 185))
                self.screen.blit(overlay, (0, 0))

                # Titles
                text_over = self.font_main.render("FLAPPY BUBBLE", True, COLOR_WHITE)
                rect_over = text_over.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 140))
                self.screen.blit(text_over, rect_over)

                text_desc = self.font_mini.render("POWER-UPS + SAVINGS BANK + CUSTOM SKINS", True, COLOR_MUTED)
                rect_desc = text_desc.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 100))
                self.screen.blit(text_desc, rect_desc)

                # Skins indicators
                text_skin = self.font_sub.render(f"Equipped Skin: {self.equipped_skin.upper()}", True, COLOR_YELLOW)
                rect_skin = text_skin.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 40))
                self.screen.blit(text_skin, rect_skin)

                text_help = self.font_mini.render("Press numeric keys 1, 2, 3, 4, 5 to select skins", True, COLOR_MUTED)
                rect_help = text_help.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 10))
                self.screen.blit(text_help, rect_help)

                # Tap launch
                text_restart = self.font_sub.render("TAP SCREEN or SPACE to Play", True, COLOR_WHITE)
                rect_restart = text_restart.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 80))
                self.screen.blit(text_restart, rect_restart)

                # Stats summary bank
                text_banks = self.font_sub.render(f"Personal Best: {self.high_score} | Bank: {self.total_coins} Coins", True, COLOR_YELLOW)
                rect_banks = text_banks.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 130))
                self.screen.blit(text_banks, rect_banks)

            elif self.state == "game_over":
                # Game over overlay screen
                overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
                overlay.fill((10, 12, 18, 220))
                self.screen.blit(overlay, (0, 0))

                # Crash warnings
                text_over = self.font_main.render("GAME OVER", True, (230, 76, 101))
                rect_over = text_over.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 120))
                self.screen.blit(text_over, rect_over)

                # Detailed scoreboard panels
                lbl_score = self.font_sub.render(f"Final Score: {self.score}", True, COLOR_WHITE)
                self.screen.blit(lbl_score, lbl_score.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 60)))

                lbl_best = self.font_sub.render(f"All-Time Best: {self.high_score}", True, COLOR_YELLOW)
                self.screen.blit(lbl_best, lbl_best.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 30)))

                lbl_coins = self.font_sub.render(f"Coins Gained: +{self.coins_session} | Bank: {self.total_coins}", True, (244, 244, 244))
                self.screen.blit(lbl_coins, lbl_coins.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)))

                lbl_combo = self.font_sub.render(f"Streak Combo peak: x{self.highest_combo}", True, (110, 165, 240))
                self.screen.blit(lbl_combo, lbl_combo.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 30)))

                # Press R
                text_restart = self.font_sub.render("Press 'R' key to Quick Restart", True, COLOR_MUTED)
                rect_restart = text_restart.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 100))
                self.screen.blit(text_restart, rect_restart)

                text_exit = self.font_mini.render("Press Esc to Quit Game", True, (110, 120, 145))
                rect_exit = text_exit.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 130))
                self.screen.blit(text_exit, rect_exit)

            pygame.display.flip()

        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    game = Game()
    game.run()
`;
}
