import { Component, OnInit } from '@angular/core';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';

@Component({
  selector: 'app-guess-the-number',
  standalone: false,
  templateUrl: './guess-the-number.html',
  styleUrl: './guess-the-number.scss',
  animations: [
    // Animation for the Feedback Text
    trigger('popIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.5) translateY(20px)' }),
        animate('0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('0.2s ease-out', style({ opacity: 0, transform: 'scale(0.8)' }))
      ])
    ]),
    // Animation for the Result Card
    trigger('cardFlip', [
      transition(':enter', [
        style({ transform: 'rotateY(90deg)', opacity: 0 }),
        animate('0.6s ease-out', style({ transform: 'rotateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class GuessTheNumber {
  targetNumber: number = 0;
  userGuess: number | null = null;
  message: string = 'Start Guessing!';
  statusClass: string = 'neutral'; // 'success', 'error', 'neutral'
  attempts: number = 0;
  gameOver: boolean = false;

  ngOnInit() {
    this.resetGame();
  }

  checkGuess() {
    if (this.userGuess === null) return;

    this.attempts++;

    // Slight delay to allow animation reset if guessing rapidly
    if (this.userGuess === this.targetNumber) {
      this.message = `Correct! It was ${this.targetNumber}.`;
      this.statusClass = 'success';
      this.gameOver = true;
    } else if (this.userGuess < this.targetNumber) {
      this.message = 'Too Low! Try higher.';
      this.statusClass = 'error';
    } else {
      this.message = 'Too High! Try lower.';
      this.statusClass = 'error';
    }
  }

  resetGame() {
    this.targetNumber = Math.floor(Math.random() * 100) + 1;
    this.userGuess = null;
    this.message = 'Guess a number between 1 and 100';
    this.statusClass = 'neutral';
    this.attempts = 0;
    this.gameOver = false;
  }
}
