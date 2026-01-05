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
export class RockPaperScissors {
   // State Variables
  score: Score = { wins: 0, losses: 0, ties: 0 };
  resultMessage: string = 'Choose to Start';

  // Image Paths
  defaultImage = 'assets/heart-emoji.png';
  // defaultImage = 'assets/animatingFlickbook.gif';
  userImage: string = this.defaultImage;
  computerImage: string = this.defaultImage;

  // Dynamic Styles
  resultBackgroundColor: string = '';
  animationClass: string = ''; // Used for 'lossEffect' or 'tieEffect'

  ngOnInit() {
    // Load score from local storage on startup
    const storedScore = localStorage.getItem('game_score');
    if (storedScore) {
      this.score = JSON.parse(storedScore);
    }
  }

  play(playerMove: string) {
    const computerMove = this.getComputerMove();

    // Update Images
    this.userImage = `assets/${playerMove}-emoji.png`;
    this.computerImage = `assets/${computerMove}-emoji.png`;

    // Game Logic
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

    // Save to Local Storage
    localStorage.setItem('game_score', JSON.stringify(this.score));
  }

  getComputerMove(): string {
    const random = Math.random();
    if (random < 1 / 3) return 'rock';
    if (random < 2 / 3) return 'paper';
    return 'scissor';
  }

  handleWin() {
    this.resultMessage = 'You won!';
    this.score.wins++;
    this.resultBackgroundColor = 'rgba(53, 120, 58, 0.78)';
    this.triggerConfetti();
  }

  handleLoss() {
    this.resultMessage = 'You lose!';
    this.score.losses++;
    this.resultBackgroundColor = '#963636e1';
    this.triggerAnimation('lossEffect');
  }

  handleTie() {
    this.resultMessage = "It's a tie!";
    this.score.ties++;
    this.resultBackgroundColor = 'rgba(251, 191, 36, 0.6)';
    this.triggerAnimation('tieEffect');
  }

  resetScore() {
    localStorage.removeItem('game_score');
    this.score = { wins: 0, losses: 0, ties: 0 };
    this.resultMessage = 'Start Game';
    this.userImage = this.defaultImage;
    this.computerImage = this.defaultImage;
    this.resultBackgroundColor = '';
  }

  // Animation Helpers
  triggerAnimation(className: string) {
    this.animationClass = className;
    setTimeout(() => {
      this.animationClass = '';
    }, 700);
  }

  triggerConfetti() {
    const duration = 2000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }
}
