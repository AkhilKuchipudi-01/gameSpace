import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  HostListener
} from '@angular/core';

@Component({
  selector: 'app-flying-bird',
  standalone: false,
  templateUrl: './flying-bird.html',
  styleUrl: './flying-bird.scss',
})
export class FlyingBird implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  // Game State
  score = 0;
  isGameOver = false;
  showOverlay = true;
  titleText = 'Ready to Fly?';
  scoreText = ''; // Separate text for score in overlay

  // Physics & Config
  private gravity = 0.5;
  private jumpStrength = -8.5;
  private pipeGap = 170;
  private pipeWidth = 60;
  private pipeSpeed = 3.5;
  private pipeInterval = 2200;
  private lastPipeTime = 0;

  // Entities
  private bird = { x: 100, y: 200, width: 35, height: 25, velocity: 0 };
  private pipes: any[] = [];
  private wingFlapPhase = 0;
  private animationFrameId: number | null = null;

  // Logical size for consistent physics on all screens
  private logicalWidth = 800;
  private logicalHeight = 600;

  // Theme detection
  private isDarkTheme = false;

  constructor(private ngZone: NgZone) { }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    // Optimize for 2D rendering
    this.ctx = canvas.getContext('2d', { alpha: false })!;

    this.checkTheme();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      this.isDarkTheme = e.matches;
      if (this.showOverlay) this.draw();
    });

    this.resizeCanvas();
    this.draw();
  }

  ngOnDestroy(): void {
    this.stopGameLoop();
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

      if (!this.animationFrameId) {
        this.bird.y = this.logicalHeight / 2;
        this.draw();
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.code === 'Space' || event.code === 'ArrowUp') {
      event.preventDefault();
      if (this.isGameOver || this.showOverlay) {
        this.startGame();
      } else {
        this.flap();
      }
    }
  }

  checkTheme() {
    this.isDarkTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  startGame(): void {
    this.isGameOver = false;
    this.showOverlay = false;
    this.score = 0;
    this.bird.y = this.logicalHeight / 2;
    this.bird.velocity = 0;
    this.pipes = [];
    this.lastPipeTime = Date.now();
    this.wingFlapPhase = 0;
    this.createPipe();

    this.ngZone.runOutsideAngular(() => {
      this.gameLoop();
    });
  }

  onCanvasClick(event: MouseEvent | TouchEvent): void {
    if (event instanceof TouchEvent) event.preventDefault();
    if (this.isGameOver || this.showOverlay) {
      this.startGame();
    } else {
      this.flap();
    }
  }

  flap(): void {
    if (!this.isGameOver) {
      this.bird.velocity = this.jumpStrength;
    }
  }

  private stopGameLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private gameLoop = (): void => {
    if (this.isGameOver) return;
    this.update();
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  private update(): void {
    // 1. Update Physics
    this.bird.velocity += this.gravity;
    this.bird.y += this.bird.velocity;
    this.wingFlapPhase += 0.3;

    // 2. Move Pipes
    this.pipes.forEach(pipe => pipe.x -= this.pipeSpeed);

    // 3. Remove off-screen pipes
    if (this.pipes.length > 0 && this.pipes[0].x + this.pipes[0].width < 0) {
      this.pipes.shift();
    }

    // 4. Collision Detection Setup
    // Slight margin so the hit box is smaller than the visual bird (feels fairer)
    const hitMarginX = 6;
    const hitMarginY = 8;

    // 5. Check Pipe Collisions
    this.pipes.forEach(pipe => {
      // AABB Collision Detection
      if (
        this.bird.x + this.bird.width - hitMarginX > pipe.x &&
        this.bird.x + hitMarginX < pipe.x + pipe.width &&
        this.bird.y + this.bird.height - hitMarginY > pipe.y &&
        this.bird.y + hitMarginY < pipe.y + pipe.height
      ) {
        this.handleGameOver();
      }

      // Score Update
      if (!pipe.passed && this.bird.x > pipe.x + pipe.width && pipe.y === 0) {
        pipe.passed = true;
        this.ngZone.run(() => this.score++);
      }
    });

    // 6. Check Boundary Collisions (Ends of Screen)
    // Hit Floor
    if (this.bird.y + this.bird.height - hitMarginY >= this.logicalHeight) {
      this.handleGameOver();
    }
    // Hit Ceiling
    if (this.bird.y + hitMarginY <= 0) {
      this.handleGameOver();
    }

    // 7. Spawn New Pipes
    const currentTime = Date.now();
    if (currentTime - this.lastPipeTime > this.pipeInterval) {
      this.createPipe();
      this.lastPipeTime = currentTime;
    }
  }

  private createPipe(): void {
    const minHeight = 60;
    const maxHeight = this.logicalHeight - this.pipeGap - minHeight;
    const height = Math.random() * (maxHeight - minHeight) + minHeight;

    this.pipes.push({ x: this.logicalWidth, y: 0, width: this.pipeWidth, height: height, passed: false });
    this.pipes.push({ x: this.logicalWidth, y: height + this.pipeGap, width: this.pipeWidth, height: this.logicalHeight - height - this.pipeGap, passed: false });
  }

  private handleGameOver(): void {
    this.stopGameLoop();
    this.ngZone.run(() => {
      this.isGameOver = true;
      this.titleText = 'Game Over!';
      this.scoreText = `Score: ${this.score}`;
      this.showOverlay = true;
    });
  }

  // --- DRAWING LOGIC (Same as before) ---

  private draw(): void {
    this.ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
    this.drawPipes();
    this.drawRealisticBird();
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

    const tilt = Math.min(Math.max(this.bird.velocity * 3, -25), 25) * (Math.PI / 180);
    const flapCycle = Math.sin(this.wingFlapPhase);

    ctx.save();
    ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
    ctx.rotate(tilt);

    this.drawArticulatedWing(ctx, p.wingFar, flapCycle, true);

    ctx.fillStyle = p.tail;
    ctx.beginPath();
    ctx.moveTo(-15, 0); ctx.lineTo(-35, -5 - (flapCycle * 2)); ctx.lineTo(-37, 5); ctx.lineTo(-15, 8); ctx.fill();

    this.drawLegs(ctx, p.leg, flapCycle);

    const bodyGrad = ctx.createRadialGradient(0, 5, 5, 0, 0, 25);
    bodyGrad.addColorStop(0, p.belly); bodyGrad.addColorStop(1, p.body);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 14, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = p.body; ctx.beginPath(); ctx.arc(16, -10, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.eye; ctx.beginPath(); ctx.arc(18, -12, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.pupil; ctx.beginPath(); ctx.arc(19, -12, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.beak; ctx.beginPath(); ctx.moveTo(25, -12); ctx.lineTo(36, -6); ctx.lineTo(25, -2); ctx.fill();

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
      const g = ctx.createLinearGradient(p.x, 0, p.x + p.width, 0);
      g.addColorStop(0, c.m); g.addColorStop(0.5, c.h); g.addColorStop(1, c.m);
      ctx.fillStyle = g; ctx.strokeStyle = c.b; ctx.lineWidth = 3;
      ctx.fillRect(p.x, p.y, p.width, p.height); ctx.strokeRect(p.x, p.y, p.width, p.height);
      const cy = p.y === 0 ? p.height - 15 : p.y;
      ctx.fillRect(p.x - 4, cy, p.width + 8, 15); ctx.strokeRect(p.x - 4, cy, p.width + 8, 15);
    });
  }
}
