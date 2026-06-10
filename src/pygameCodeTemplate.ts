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
Pygame Flappy Bird - Object-Oriented Single File Clone
Target Python: 3.11+
Dependency: pygame>=2.5.0

Controls:
  - SPACE: Jump / Flap
  - R: Restart on Game Over
  - ESC/Close: Exit Game
"""

import sys
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

# Colors definitions (RGB tuple representation)
COLOR_SKY = (24, 28, 41)         # Deep indigo space/sky tone
COLOR_PIPE = (46, 196, 182)      # Cyber teal pipe accent
COLOR_PIPE_DARK = (32, 137, 127) # Shadow outline for pipes
COLOR_PLAYER = (255, 159, 67)    # Golden orange circular agent
COLOR_GROUND = (15, 18, 26)       # Dark ground platform
COLOR_WHITE = (255, 255, 255)    # Text color
COLOR_MUTED = (140, 150, 175)    # Secondary label text

# ==========================================
# OBJECT-ORIENTED CLASS REPRESENTATIONS
# ==========================================

class Player:
    """
    Represents the circular player agent controlled by gravitational force and jump input.
    """
    def __init__(self):
        self.radius = 16
        self.x = 80
        self.y = SCREEN_HEIGHT // 2
        self.velocity = 0.0
        self.max_fall_speed = 10.0

    def jump(self):
        """
        Applies an instantaneous upward force, overcoming downward velocity.
        """
        self.velocity = JUMP_FORCE

    def update(self):
        """
        Applies gravity to update vertical position, with bottom viewport bounds clamping.
        """
        # Apply standard acceleration
        self.velocity += GRAVITY
        
        # Clamp velocity to prevent rapid terminal velocity clipping
        if self.velocity > self.max_fall_speed:
            self.velocity = self.max_fall_speed
            
        self.y += int(self.velocity)
        
        # Bottom screen boundary check
        ground_level = SCREEN_HEIGHT - 60
        if self.y + self.radius > ground_level:
            self.y = ground_level - self.radius
            self.velocity = 0

    def draw(self, screen):
        """
        Renders the player agent to the screen frame with circular coordinates and light core overlay.
        """
        # Render main shadow layer
        pygame.draw.circle(screen, (190, 80, 20), (self.x, self.y), self.radius)
        # Render main circle body
        pygame.draw.circle(screen, COLOR_PLAYER, (self.x, self.y), self.radius - 2)
        # Render light reflection element for organic shape context
        pygame.draw.circle(screen, (255, 200, 120), (self.x - 4, self.y - 4), 4)


class Pipe:
    """
    Represents double-segment obstacles (top and bottom) offset by random positions.
    """
    def __init__(self, x):
        self.x = x
        self.width = 70
        self.gap_height = PIPE_GAP
        self.passed = False
        
        # Derive relative top and bottom positions using a safe vertical corridor
        min_pipe_height = 50
        max_pipe_height = SCREEN_HEIGHT - 60 - self.gap_height - min_pipe_height
        self.top_height = random.randint(min_pipe_height, max_pipe_height)
        
        self.bottom_y = self.top_height + self.gap_height
        self.bottom_height = SCREEN_HEIGHT - 60 - self.bottom_y

    def update(self):
        """
        Scrolls the obstacles to the left by constant speed.
        """
        self.x -= GAME_SPEED

    def draw(self, screen):
        """
        Draws top and bottom pipe bounding rects with high-contrast boarders.
        """
        # --- Top segment bounding rectangles ---
        top_rect = pygame.Rect(int(self.x), 0, self.width, self.top_height)
        pygame.draw.rect(screen, COLOR_PIPE, top_rect)
        pygame.draw.rect(screen, COLOR_PIPE_DARK, top_rect, 3) # border outline
        # Top segment rim indicator
        rim_y_top = self.top_height - 20
        if rim_y_top >= 0:
            pygame.draw.rect(screen, COLOR_PIPE, (int(self.x) - 4, rim_y_top, self.width + 8, 20))
            pygame.draw.rect(screen, COLOR_PIPE_DARK, (int(self.x) - 4, rim_y_top, self.width + 8, 20), 3)

        # --- Bottom segment bounding rectangles ---
        bottom_rect = pygame.Rect(int(self.x), self.bottom_y, self.width, self.bottom_height)
        pygame.draw.rect(screen, COLOR_PIPE, bottom_rect)
        pygame.draw.rect(screen, COLOR_PIPE_DARK, bottom_rect, 3) # border outline
        # Bottom segment rim indicator
        pygame.draw.rect(screen, COLOR_PIPE, (int(self.x) - 4, self.bottom_y, self.width + 8, 20))
        pygame.draw.rect(screen, COLOR_PIPE_DARK, (int(self.x) - 4, self.bottom_y, self.width + 8, 20), 3)

    def collides_with_player(self, player):
        """
        Determines circle-to-rectangle intersection on both segments.
        Calculates closest point on rectangle boundaries to circular center coordinates.
        """
        # Outer definitions
        top_rect = pygame.Rect(int(self.x), 0, self.width, self.top_height)
        bottom_rect = pygame.Rect(int(self.x), self.bottom_y, self.width, self.bottom_height)

        def check_rect_overlap(rect):
            # Find closest horizontal and vertical coordinates clamped to rect dimensions
            closest_x = max(rect.left, min(player.x, rect.right))
            closest_y = max(rect.top, min(player.y, rect.bottom))

            # Hypotenuse distance evaluation
            dx = player.x - closest_x
            dy = player.y - closest_y
            return (dx ** 2 + dy ** 2) < (player.radius ** 2)

        return check_rect_overlap(top_rect) or check_rect_overlap(bottom_rect)


class Game:
    """
    Orchestrates screen init, inputs tracking, layout updates, collisions and game states.
    """
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Pygame Flappy Bird - Workspace Sandbox")
        self.clock = pygame.time.Clock()
        self.font_main = pygame.font.SysFont("Arial", 28, bold=True)
        self.font_sub = pygame.font.SysFont("Arial", 16)
        
        # Scoring metrics
        self.score = 0
        self.high_score = 0
        
        self.reset_game()

    def reset_game(self):
        """
        Reinitializes the simulation parameters to the default start status.
        """
        self.player = Player()
        self.pipes = []
        self.frame_counter = 0
        self.game_over = False
        self.score = 0

    def spawn_pipe(self):
        """
        Instantiates a new obstacle pair positioned at the right boundary edge.
        """
        self.pipes.append(Pipe(SCREEN_WIDTH + 10))

    def run(self):
        """
        Launches the primary clock-gated main loop running at steady 60 FPS.
        """
        running = True
        while running:
            # Gating clock speed
            self.clock.tick(FPS)
            self.frame_counter += 1

            # Event loop monitoring standard user inputs
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        running = False
                    elif event.key == pygame.K_SPACE:
                        if not self.game_over:
                            self.player.jump()
                    elif event.key == pygame.K_r:
                        if self.game_over:
                            self.reset_game()

            # --- Physical updates status ---
            if not self.game_over:
                self.player.update()

                # Trigger obstacle generation cycle
                if self.frame_counter % PIPE_INTERVAL == 0:
                    self.spawn_pipe()

                # Iterate update behaviors backwards for safe slicing deletions
                for pipe in self.pipes[:]:
                    pipe.update()

                    # Scoring verification checking x coordinate passing edge
                    if not pipe.passed and pipe.x + pipe.width < self.player.x:
                        pipe.passed = True
                        self.score += 1
                        if self.score > self.high_score:
                            self.high_score = self.score

                    # Collision assessment
                    if pipe.collides_with_player(self.player):
                        self.game_over = True

                    # Memory cleanup: remove objects off-screen
                    if pipe.x + pipe.width < -10:
                        self.pipes.remove(pipe)

                # Roof boundary collapse condition
                if self.player.y - self.player.radius < 0:
                    self.game_over = True

                # Floor collision check
                ground_level = SCREEN_HEIGHT - 60
                if self.player.y + self.player.radius >= ground_level - 2:
                    self.game_over = True

            # --- Frame Rendering Operations ---
            # Fill canvas with base twilight theme backplane
            self.screen.fill(COLOR_SKY)

            # Draw static sky decorations (stars/moon vectors)
            pygame.draw.circle(self.screen, (34, 40, 58), (320, 100), 40) # stylized twilight moon
            pygame.draw.circle(self.screen, COLOR_SKY, (305, 100), 35) # moon crescent cutout

            # Render active pipes
            for pipe in self.pipes:
                pipe.draw(self.screen)

            # Draw ground overlay anchor
            pygame.draw.rect(self.screen, COLOR_GROUND, (0, SCREEN_HEIGHT - 60, SCREEN_WIDTH, 60))
            # Stylish accent separator line on ground
            pygame.draw.line(self.screen, COLOR_PIPE_DARK, (0, SCREEN_HEIGHT - 60), (SCREEN_WIDTH, SCREEN_HEIGHT - 60), 3)

            # Draw player circle agent
            self.player.draw(self.screen)

            # Draw heads up text status dashboard
            if not self.game_over:
                # Active score marker
                score_surface = self.font_main.render(str(self.score), True, COLOR_WHITE)
                score_rect = score_surface.get_rect(center=(SCREEN_WIDTH // 2, 60))
                self.screen.blit(score_surface, score_rect)
            else:
                # Overlay background shading panel on collapse
                overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
                overlay.fill((10, 12, 18, 210))
                self.screen.blit(overlay, (0, 0))

                # Game Over Title Text
                text_over = self.font_main.render("GAME OVER", True, (230, 76, 101))
                rect_over = text_over.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 80))
                self.screen.blit(text_over, rect_over)

                # Real-time Score breakdown
                text_score = self.font_sub.render(f"Current Score: {self.score}", True, COLOR_WHITE)
                rect_score = text_score.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 20))
                self.screen.blit(text_score, rect_score)

                text_best = self.font_sub.render(f"All-Time Best: {self.high_score}", True, (255, 215, 0))
                rect_best = text_best.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 10))
                self.screen.blit(text_best, rect_best)

                # Restart Instruction indicators
                text_restart = self.font_sub.render("Press 'R' to Restart Simulation", True, COLOR_MUTED)
                rect_restart = text_restart.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 80))
                self.screen.blit(text_restart, rect_restart)

                text_exit = self.font_sub.render("Press 'SPACE' to flap the player", True, (110, 120, 145))
                rect_exit = text_exit.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 110))
                self.screen.blit(text_exit, rect_exit)

            # Push visual frame buffer updates to device window
            pygame.display.flip()

        pygame.quit()
        sys.exit()

if __name__ == "__main__":
    game = Game()
    game.run()
`;
}
