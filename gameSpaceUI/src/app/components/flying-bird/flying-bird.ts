import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  HostListener
} from '@angular/core';
import { Location } from '@angular/common';

// --- Interfaces for Game Entities ---
interface Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
  opacity: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;     // 1.0 to 0.0
  color: string;
  size: number;
}

interface Pipe {
  x: number;
  y: number;
  width: number;
  height: number;
  passed: boolean;
  id: number; // Unique ID for tracking
}

@Component({
  selector: 'app-flying-bird',
  standalone: false,
  templateUrl: './flying-bird.html',
  styleUrl: './flying-bird.scss',
})
export class FlyingBird implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  // --- Game State ---
  score = 0;
  highScore = 0;
  isGameOver = false;
  isPaused = false;
  showOverlay = true;
  titleText = 'Ready to Fly?';
  scoreText = '';
  
  // --- Physics & Config ---
  private readonly gravity = 0.5;
  private readonly jumpStrength = -8.5;
  private readonly pipeGap = 180; // Slightly wider for better playability
  private readonly pipeWidth = 65;
  private readonly pipeSpeed = 3.5;
  private readonly pipeSpawnRate = 2200; // ms
  private lastPipeTime = 0;
  private pauseStartTime = 0;

  // --- Entities ---
  private bird = { 
    x: 100, 
    y: 300, 
    width: 35, 
    height: 25, 
    velocity: 0, 
    rotation: 0 // Current visual rotation
  };
  
  private pipes: Pipe[] = [];
  private clouds: Cloud[] = [];
  private particles: Particle[] = [];
  
  // Animation variables
  private wingFlapPhase = 0;
  private groundOffset = 0;
  private animationFrameId: number | null = null;
  private frameCount = 0;

  // --- Screen Logical Size ---
  private logicalWidth = 800;
  private logicalHeight = 600;
  private isDarkTheme = false;

  constructor(private ngZone: NgZone, private location: Location) {}

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    // Optimize for frequent redraws
    this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true })!;

    this.checkTheme();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      this.isDarkTheme = e.matches;
      if (this.showOverlay || this.isPaused) this.draw();
    });

    this.initClouds(); // Pre-populate clouds
    this.resizeCanvas();
    this.draw(); // Initial static draw
  }

  ngOnDestroy(): void {
    this.stopGameLoop();
  }

  // --- Input Handling ---
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    const code = event.code;
    
    if (code === 'Space' && event.ctrlKey) {
      event.preventDefault();
      this.togglePause();
      return;
    }

    if (code === 'Escape') {
      event.preventDefault();
      this.goBack();
      return;
    }

    if (code === 'Space' || code === 'ArrowUp') {
      event.preventDefault();
      if (this.isPaused) {
        this.togglePause();
      } else if (this.isGameOver || this.showOverlay) {
        this.startGame();
      } else {
        this.flap();
      }
    }
  }

  @HostListener('window:resize')
  resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;
    if (container) {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      this.ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      this.logicalWidth = rect.width;
      this.logicalHeight = rect.height;

      if (!this.animationFrameId) this.draw();
    }
  }

  checkTheme() {
    this.isDarkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  goBack(): void {
    this.stopGameLoop();
    this.location.back();
  }

  togglePause(): void {
    if (this.showOverlay && !this.isPaused) return; 

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.stopGameLoop();
      this.pauseStartTime = Date.now();
      // Draw once to ensure overlay sits on top of game state
      this.draw();
    } else {
      const duration = Date.now() - this.pauseStartTime;
      this.lastPipeTime += duration; 
      this.ngZone.runOutsideAngular(() => this.gameLoop());
    }
  }

  startGame(): void {
    this.isGameOver = false;
    this.showOverlay = false;
    this.isPaused = false;
    this.score = 0;
    
    // Reset Bird
    this.bird.y = this.logicalHeight / 2;
    this.bird.velocity = 0;
    this.bird.rotation = 0;

    this.pipes = [];
    this.particles = [];
    this.lastPipeTime = Date.now();
    this.wingFlapPhase = 0;
    
    // Reset Clouds to random positions to feel fresh
    this.initClouds();
    this.createPipe();

    this.ngZone.runOutsideAngular(() => this.gameLoop());
  }

  onCanvasClick(event: MouseEvent | TouchEvent): void {
    if (event instanceof TouchEvent) event.preventDefault();
    if (this.isPaused) return;

    if (this.isGameOver || this.showOverlay) {
      this.startGame();
    } else {
      this.flap();
    }
  }

  flap(): void {
    if (!this.isGameOver && !this.isPaused) {
      this.bird.velocity = this.jumpStrength;
      // Spawn feather particles
      this.spawnParticles(this.bird.x, this.bird.y + 10, 3, '#fff');
    }
  }

  private stopGameLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private gameLoop = (): void => {
    if (this.isGameOver || this.isPaused) return;
    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  // --- LOGIC UPDATES ---

  private update(): void {
    this.frameCount++;

    // 1. Update Physics
    this.bird.velocity += this.gravity;
    this.bird.y += this.bird.velocity;
    this.wingFlapPhase += 0.3;

    // Smooth Rotation Calculation
    // Tilt up when jumping, tilt down when falling
    let targetRotation = 0;
    if (this.bird.velocity < -2) targetRotation = -25 * (Math.PI / 180);
    else if (this.bird.velocity > 2) targetRotation = Math.min(this.bird.velocity * 4, 90) * (Math.PI / 180);
    
    // Lerp rotation for smoothness (Current + (Target - Current) * factor)
    this.bird.rotation += (targetRotation - this.bird.rotation) * 0.15;

    // 2. Update Ground Offset
    this.groundOffset = (this.groundOffset + this.pipeSpeed) % 40;

    // 3. Update Clouds (Parallax)
    this.updateClouds();

    // 4. Update Particles
    this.updateParticles();

    // 5. Update Pipes
    this.pipes.forEach(pipe => pipe.x -= this.pipeSpeed);
    
    // Remove off-screen pipes
    if (this.pipes.length > 0 && this.pipes[0].x + this.pipes[0].width < -100) {
      this.pipes.shift();
    }

    // 6. Collision Detection
    const hitMarginX = 8;
    const hitMarginY = 10;
    const floorHeight = 30; // Height of scrolling ground

    // Pipe Collision
    this.pipes.forEach(pipe => {
      // AABB Collision
      if (
        this.bird.x + this.bird.width - hitMarginX > pipe.x &&
        this.bird.x + hitMarginX < pipe.x + pipe.width &&
        this.bird.y + this.bird.height - hitMarginY > pipe.y &&
        this.bird.y + hitMarginY < pipe.y + pipe.height
      ) {
        this.handleGameOver();
      }

      // Score
      if (!pipe.passed && this.bird.x > pipe.x + pipe.width && pipe.y === 0) {
        pipe.passed = true;
        this.ngZone.run(() => this.score++);
      }
    });

    // Floor/Ceiling Collision
    if (this.bird.y + this.bird.height - hitMarginY >= this.logicalHeight - floorHeight) {
      this.bird.y = this.logicalHeight - floorHeight - this.bird.height + hitMarginY; // Snap to floor
      this.handleGameOver();
    }
    if (this.bird.y + hitMarginY <= 0) {
      this.handleGameOver();
    }

    // 7. Spawning
    const currentTime = Date.now();
    if (currentTime - this.lastPipeTime > this.pipeSpawnRate) {
      this.createPipe();
      this.lastPipeTime = currentTime;
    }
  }

  // --- Entity Management ---

  private initClouds(): void {
    this.clouds = [];
    // Create initial batch of clouds
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.logicalWidth,
        y: Math.random() * (this.logicalHeight / 2),
        speed: 0.5 + Math.random() * 1.5,
        scale: 0.5 + Math.random() * 0.8,
        opacity: 0.3 + Math.random() * 0.4
      });
    }
  }

  private updateClouds(): void {
    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed;
      if (cloud.x + (100 * cloud.scale) < 0) {
        cloud.x = this.logicalWidth;
        cloud.y = Math.random() * (this.logicalHeight / 1.5);
      }
    });
  }

  private spawnParticles(x: number, y: number, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1.0,
        color: color,
        size: Math.random() * 3 + 1
      });
    }
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // Gravity for particles
      p.life -= 0.03; // Fade out
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private createPipe(): void {
    const minHeight = 80;
    const floorHeight = 30;
    const availableHeight = this.logicalHeight - floorHeight;
    const maxHeight = availableHeight - this.pipeGap - minHeight;
    const height = Math.random() * (maxHeight - minHeight) + minHeight;
    const id = Date.now();

    this.pipes.push({ 
      id: id,
      x: this.logicalWidth, 
      y: 0, 
      width: this.pipeWidth, 
      height: height, 
      passed: false 
    });
    
    this.pipes.push({ 
      id: id + 1,
      x: this.logicalWidth, 
      y: height + this.pipeGap, 
      width: this.pipeWidth, 
      height: availableHeight - height - this.pipeGap, 
      passed: false 
    });
  }

  private handleGameOver(): void {
    this.stopGameLoop();
    // Explosion Effect
    this.spawnParticles(this.bird.x + 15, this.bird.y + 10, 20, '#ff4757');
    this.draw(); // Draw final state with particles

    this.ngZone.run(() => {
      this.isGameOver = true;
      this.titleText = 'Crashed!';
      this.scoreText = `Score: ${this.score}`;
      this.showOverlay = true;
    });
  }

  // --- RENDERING ---

  private draw(): void {
    // 1. Clear Screen
    this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);

    // 2. Draw Clouds (Background)
    this.drawClouds();

    // 3. Draw Pipes
    this.drawPipes();

    // 4. Draw Ground
    this.drawGround();

    // 5. Draw Bird
    this.drawRealisticBird();

    // 6. Draw Particles (Overlay)
    this.drawParticles();
  }

  private drawClouds(): void {
    const ctx = this.ctx;
    this.clouds.forEach(c => {
      ctx.save();
      ctx.globalAlpha = c.opacity;
      ctx.fillStyle = this.isDarkTheme ? '#ffffff' : '#ffffff';
      ctx.translate(c.x, c.y);
      ctx.scale(c.scale, c.scale);
      // Simple cloud shape
      ctx.beginPath();
      ctx.arc(20, 20, 20, 0, Math.PI * 2);
      ctx.arc(50, 20, 25, 0, Math.PI * 2);
      ctx.arc(80, 20, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private drawGround(): void {
    const ctx = this.ctx;
    const floorHeight = 30;
    const y = this.logicalHeight - floorHeight;
    
    // Ground Body
    ctx.fillStyle = this.isDarkTheme ? '#2d3436' : '#dedede';
    ctx.fillRect(0, y, this.logicalWidth, floorHeight);
    
    // Top Border
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(this.logicalWidth, y);
    ctx.strokeStyle = this.isDarkTheme ? '#e056fd' : '#76c893';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Moving Details (stripes) to show speed
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, y, this.logicalWidth, floorHeight);
    ctx.clip();
    
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 2;
    for(let i = -40; i < this.logicalWidth; i += 40) {
      // Use groundOffset to make it move
      const drawX = i - this.groundOffset;
      ctx.beginPath();
      ctx.moveTo(drawX, y);
      ctx.lineTo(drawX - 20, this.logicalHeight);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawParticles(): void {
    const ctx = this.ctx;
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  private drawRealisticBird(): void {
    const ctx = this.ctx;
    const p = this.isDarkTheme ? {
      body: '#00d2ff', belly: '#3a7bd5', beak: '#f72585',
      eye: '#ffffff', pupil: '#000000', leg: '#b5179e',
      wingNear: '#4cc9f0', wingFar: '#3a0ca3', tail: '#7209b7'
    } : {
      body: '#ff4757', belly: '#ffeaa7', beak: '#ffa502',
      eye: '#ffffff', pupil: '#2f3542', leg: '#2f3542',
      wingNear: '#ff6b81', wingFar: '#c0392b', tail: '#e17055'
    };

    const flapCycle = Math.sin(this.wingFlapPhase);

    ctx.save();
    // Translate to Center of Bird for Rotation
    ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
    ctx.rotate(this.bird.rotation);

    // Draw Far Wing
    this.drawArticulatedWing(ctx, p.wingFar, flapCycle, true);

    // Draw Tail
    ctx.fillStyle = p.tail;
    ctx.beginPath();
    ctx.moveTo(-15, 0); ctx.lineTo(-35, -5 - (flapCycle * 2)); ctx.lineTo(-37, 5); ctx.lineTo(-15, 8); ctx.fill();

    // Draw Legs
    this.drawLegs(ctx, p.leg, flapCycle);

    // Draw Body
    const bodyGrad = ctx.createRadialGradient(0, 5, 5, 0, 0, 25);
    bodyGrad.addColorStop(0, p.belly); bodyGrad.addColorStop(1, p.body);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 14, 0, 0, Math.PI * 2); ctx.fill();

    // Draw Head Details
    ctx.fillStyle = p.body; ctx.beginPath(); ctx.arc(16, -10, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.eye; ctx.beginPath(); ctx.arc(18, -12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.pupil; ctx.beginPath(); ctx.arc(19, -12, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.beak; ctx.beginPath(); ctx.moveTo(25, -12); ctx.lineTo(36, -6); ctx.lineTo(25, -2); ctx.fill();

    // Draw Near Wing
    this.drawArticulatedWing(ctx, p.wingNear, flapCycle, false);
    
    ctx.restore();
  }

  private drawArticulatedWing(ctx: CanvasRenderingContext2D, color: string, flapCycle: number, isFar: boolean): void {
    ctx.save();
    const angle = isFar ? (flapCycle * 20 * Math.PI / 180) - 0.2 : (flapCycle * 40 * Math.PI / 180);
    ctx.translate(2, -6); ctx.rotate(angle); ctx.fillStyle = color;
    const fold = flapCycle < 0 ? 6 : 0;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-12 + fold, -18 + fold, -40 + (fold * 2), -4);
    ctx.bezierCurveTo(-28 + fold, 8, -7 + fold, 6, 6, 6);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  private drawLegs(ctx: CanvasRenderingContext2D, color: string, flapCycle: number): void {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.translate(-4, 10); ctx.rotate(Math.sin(this.wingFlapPhase * 0.5) * 0.3 + 0.4);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-3, 7); ctx.stroke();
    ctx.translate(-3, 7);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(4, 2); ctx.moveTo(0, 0); ctx.lineTo(-1, 4); ctx.moveTo(0, 0); ctx.lineTo(-4, 2); ctx.stroke();
    ctx.restore();
  }

  private drawPipes(): void {
    const ctx = this.ctx;
    const c = this.isDarkTheme ? { m: '#2d3436', h: '#636e72', b: '#e056fd' } : { m: '#76c893', h: '#b5e48c', b: '#1a535c' };
    
    this.pipes.forEach(p => {
      // Gradient Pipe Body
      const g = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
      g.addColorStop(0, c.m); g.addColorStop(0.5, c.h); g.addColorStop(1, c.m);
      
      ctx.fillStyle = g; 
      ctx.strokeStyle = c.b; 
      ctx.lineWidth = 3;
      
      // Draw Pipe Shaft
      ctx.fillRect(p.x, p.y, p.width, p.height); 
      ctx.strokeRect(p.x, p.y, p.width, p.height);
      
      // Draw Pipe Cap
      const capHeight = 25;
      const capOverhang = 6;
      const cy = p.y === 0 ? p.height - capHeight : p.y;
      
      ctx.fillStyle = g;
      ctx.fillRect(p.x - capOverhang, cy, p.width + (capOverhang*2), capHeight); 
      ctx.strokeRect(p.x - capOverhang, cy, p.width + (capOverhang*2), capHeight);
      
      // Add Shine Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(p.x + 10, p.y === 0 ? 0 : p.y + capHeight, 10, p.y === 0 ? p.height - capHeight : p.height - capHeight);
    });
  }
}
