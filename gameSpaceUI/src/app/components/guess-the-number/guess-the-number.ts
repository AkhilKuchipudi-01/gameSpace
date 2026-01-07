import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { trigger, style, animate, transition, keyframes } from '@angular/animations';

@Component({
  selector: 'app-guess-the-number',
  standalone: false,
  templateUrl: './guess-the-number.html',
  styleUrl: './guess-the-number.scss',
  animations: [
    // Text Pop-in
    trigger('popIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.5) translateY(20px)' }),
        animate('0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ])
    ]),
    // Card Entrance
    trigger('cardFlip', [
      transition(':enter', [
        style({ transform: 'rotateY(90deg)', opacity: 0 }),
        animate('0.6s ease-out', style({ transform: 'rotateY(0)', opacity: 1 }))
      ])
    ]),
    // Shake effect for wrong answers
    trigger('shake', [
      transition('* => true', [
        animate('0.4s ease-in-out', keyframes([
          style({ transform: 'translate3d(-10px, 0, 0)', offset: 0.1 }),
          style({ transform: 'translate3d(10px, 0, 0)', offset: 0.2 }),
          style({ transform: 'translate3d(-10px, 0, 0)', offset: 0.3 }),
          style({ transform: 'translate3d(10px, 0, 0)', offset: 0.4 }),
          style({ transform: 'translate3d(-5px, 0, 0)', offset: 0.5 }),
          style({ transform: 'translate3d(5px, 0, 0)', offset: 0.6 }),
          style({ transform: 'translate3d(0, 0, 0)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class GuessTheNumber implements OnInit {
  @ViewChild('guessInput') guessInput!: ElementRef;

  readonly MAX_ATTEMPTS = 5;
  targetNumber = 0;
  userGuess: number | null = null;

  // Game State
  message = '';
  statusClass = 'neutral'; // 'neutral', 'success', 'error', 'warning'
  attemptsLeft = 0;
  gameState: 'playing' | 'won' | 'lost' = 'playing';
  shakeState = false;

  ngOnInit() {
    this.resetGame();
  }

  checkGuess() {
    // 1. Validation
    if (this.userGuess === null || this.gameState !== 'playing') return;

    if (this.userGuess < 1 || this.userGuess > 100) {
      this.setMessage('Please enter a number between 1 and 100', 'warning');
      return;
    }

    // 2. Logic
    this.attemptsLeft--;

    if (this.userGuess === this.targetNumber) {
      this.handleWin();
    } else if (this.attemptsLeft === 0) {
      this.handleLoss();
    } else {
      this.handleWrongGuess();
    }

    // Reset input for next guess
    this.userGuess = null;
    this.triggerShake();
  }

  private handleWrongGuess() {
    const difference = Math.abs(this.userGuess! - this.targetNumber);
    const hint = this.userGuess! < this.targetNumber ? 'Too Low' : 'Too High';

    let proximity = '';
    if (difference <= 5) {
      proximity = ' you are very close';
      this.statusClass = 'warning'; 
    } else if (difference <= 10) {
      proximity = ' you are getting close';
    }

    this.setMessage(`${hint}!${proximity} Try again.`, proximity ? 'warning' : 'error');
  }

  private handleWin() {
    this.gameState = 'won';
    this.setMessage(`Correct! The number was ${this.targetNumber}.`, 'success');
  }

  private handleLoss() {
    this.gameState = 'lost';
    this.setMessage(`Game Over! The number was ${this.targetNumber}.`, 'error');
  }

  resetGame() {
    this.targetNumber = Math.floor(Math.random() * 100) + 1;
    this.userGuess = null;
    this.gameState = 'playing';
    this.attemptsLeft = this.MAX_ATTEMPTS;
    this.setMessage('Guess a number between 1 and 100', 'neutral');

    // Auto focus input after a short delay
    setTimeout(() => {
      if (this.guessInput) this.guessInput.nativeElement.focus();
    }, 100);
  }

  private setMessage(text: string, type: string) {
    this.message = text;
    this.statusClass = type;
  }

  private triggerShake() {
    // Only shake on wrong answers or invalid input
    if (this.gameState !== 'won') {
      this.shakeState = true;
      setTimeout(() => this.shakeState = false, 400); // Reset trigger
    }
  }
}

// import { Component, OnInit } from '@angular/core';
// import { trigger, style, animate, transition, keyframes } from '@angular/animations';

// @Component({
//   selector: 'app-guess-the-number',
//   standalone: false,
//   templateUrl: './guess-the-number.html',
//   styleUrl: './guess-the-number.scss',
//   animations: [
//     // Animation for the Feedback Text
//     trigger('popIn', [
//       transition(':enter', [
//         style({ opacity: 0, transform: 'scale(0.5) translateY(20px)' }),
//         animate('0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
//           style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
//       ]),
//       transition(':leave', [
//         animate('0.2s ease-out', style({ opacity: 0, transform: 'scale(0.8)' }))
//       ])
//     ]),
//     // Animation for the Result Card
//     trigger('cardFlip', [
//       transition(':enter', [
//         style({ transform: 'rotateY(90deg)', opacity: 0 }),
//         animate('0.6s ease-out', style({ transform: 'rotateY(0)', opacity: 1 }))
//       ])
//     ])
//   ]
// })
// export class GuessTheNumber {
//   targetNumber: number = 0;
//   userGuess: number | null = null;
//   message: string = 'Start Guessing!';
//   statusClass: string = 'neutral'; // 'success', 'error', 'neutral'
//   attempts: number = 0;
//   gameOver: boolean = false;

//   ngOnInit() {
//     this.resetGame();
//   }

//   checkGuess() {
//     if (this.userGuess === null) return;

//     this.attempts++;

//     // Slight delay to allow animation reset if guessing rapidly
//     if (this.userGuess === this.targetNumber) {
//       this.message = `Correct! It was ${this.targetNumber}.`;
//       this.statusClass = 'success';
//       this.gameOver = true;
//     } else if (this.userGuess < this.targetNumber) {
//       this.message = 'Too Low! Try higher.';
//       this.statusClass = 'error';
//     } else {
//       this.message = 'Too High! Try lower.';
//       this.statusClass = 'error';
//     }
//   }

//   resetGame() {
//     this.targetNumber = Math.floor(Math.random() * 100) + 1;
//     this.userGuess = null;
//     this.message = 'Guess a number between 1 and 100';
//     this.statusClass = 'neutral';
//     this.attempts = 0;
//     this.gameOver = false;
//   }
// }
