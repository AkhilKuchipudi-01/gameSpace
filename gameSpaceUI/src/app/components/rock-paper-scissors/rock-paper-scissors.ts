import { Component, OnInit } from '@angular/core';
import confetti from 'canvas-confetti';

interface Score {
  wins: number;
  losses: number;
  ties: number;
}

@Component({
  selector: 'app-rock-paper-scissors',
  standalone: false,
  templateUrl: './rock-paper-scissors.html',
  styleUrl: './rock-paper-scissors.scss',
})
export class RockPaperScissors implements OnInit {
  score: Score = { wins: 0, losses: 0, ties: 0 };
  resultMessage: string = 'Choose to Start';

  defaultImage = 'assets/heart-emoji.png'; 
  userImage: string = this.defaultImage;
  computerImage: string = this.defaultImage;

  resultBackgroundColor: string = '';
  animationClass: string = ''; 

  private isConfettiActive = false;

  ngOnInit() {
    const storedScore = localStorage.getItem('game_score');
    if (storedScore) {
      this.score = JSON.parse(storedScore);
    }
  }

  play(playerMove: string) {
    this.stopConfetti();

    const computerMove = this.getComputerMove();

    this.userImage = `assets/${playerMove}-emoji.png`;
    this.computerImage = `assets/${computerMove}-emoji.png`;

    if (playerMove === computerMove) {
      this.handleTie();
    } else if (
      (playerMove === 'rock' && computerMove === 'scissor') ||
      (playerMove === 'paper' && computerMove === 'rock') ||
      (playerMove === 'scissor' && computerMove === 'paper')
    ) {
      this.handleWin();
    } else {
      this.handleLoss();
    }

    localStorage.setItem('game_score', JSON.stringify(this.score));
  }

  getComputerMove(): string {
    const random = Math.random();
    if (random < 1 / 3) return 'rock';
    if (random < 2 / 3) return 'paper';
    return 'scissor';
  }

  handleWin() {
    this.resultMessage = 'You Won!';
    this.score.wins++;
    this.resultBackgroundColor = 'rgba(16, 185, 129, 0.4)'; 
    this.triggerConfetti();
  }

  handleLoss() {
    this.resultMessage = 'You Lost!';
    this.score.losses++;
    this.resultBackgroundColor = 'rgba(244, 63, 94, 0.4)'; 
    this.triggerAnimation('lossEffect');
  }

  handleTie() {
    this.resultMessage = "It's a Tie!";
    this.score.ties++;
    this.resultBackgroundColor = 'rgba(234, 179, 8, 0.4)'; 
    this.triggerAnimation('tieEffect');
  }

  resetScore() {
    this.stopConfetti();
    localStorage.removeItem('game_score');
    this.score = { wins: 0, losses: 0, ties: 0 };
    this.resultMessage = 'Choose to Start';
    this.userImage = this.defaultImage;
    this.computerImage = this.defaultImage;
    this.resultBackgroundColor = '';
    this.animationClass = '';
  }

  triggerAnimation(className: string) {
    this.animationClass = className;
    setTimeout(() => {
      this.animationClass = '';
    }, 500);
  }

  triggerConfetti() {
    this.isConfettiActive = true;
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      if (!this.isConfettiActive) return;

      confetti({ 
        particleCount: 5, 
        angle: 60, 
        spread: 55, 
        origin: { x: 0 },
        colors: ['#6366f1', '#ec4899', '#eab308'] 
      });
      confetti({ 
        particleCount: 5, 
        angle: 120, 
        spread: 55, 
        origin: { x: 1 },
        colors: ['#6366f1', '#ec4899', '#eab308']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      } else {
        this.isConfettiActive = false;
      }
    };

    frame();
  }

  stopConfetti() {
    this.isConfettiActive = false; 
    confetti.reset(); 
  }
}
