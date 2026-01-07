import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

interface Game {
  title: string;
  description: string;
  icon: string;
  link: string;
}

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  isMobileMenuOpen = false;

  games: Game[] = [
    {
      title: 'Rock Paper Scissors',
      description: 'Test your luck and strategy in this classic hand game. Challenge the AI or play against friends.',
      icon: 'content_cut',
      link: '/rps'
    },
    {
      title: 'Flying Bird',
      description: 'Navigate through obstacles and beat the high score in this addictive arcade flying adventure.',
      icon: 'flutter_dash',
      link: '/bird'
    },
    {
      title: 'Guess the Number',
      description: 'Can you find the secret number? Use hints and logic to guess correctly in the fewest tries.',
      icon: 'question_mark',
      link: '/guess'
    }
  ];

  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
