import { Component, Inject, OnInit, OnDestroy, Renderer2, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

interface Game {
  title: string;
  description: string;
  icon: string;
  link: string;
}

type Theme = 'light' | 'dark' | 'system';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  theme: Theme = 'system';

  private mediaQueryList?: MediaQueryList;

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

  constructor(
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) {
        this.theme = savedTheme;
      }

      this.mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQueryList.addEventListener('change', this.handleSystemChange);
      this.applyTheme();
    }
  }

  ngOnDestroy() {
    if (this.mediaQueryList) {
      this.mediaQueryList.removeEventListener('change', this.handleSystemChange);
    }
  }

  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleTheme() {
    if (this.theme === 'system') {
      this.theme = 'light';
    } else if (this.theme === 'light') {
      this.theme = 'dark';
    } else {
      this.theme = 'system';
    }

    localStorage.setItem('theme', this.theme);
    this.applyTheme();
  }

  private handleSystemChange = (e: MediaQueryListEvent) => {
    if (this.theme === 'system') {
      this.applyTheme();
    }
  };

  private applyTheme() {
    const html = document.documentElement;
    let targetTheme = this.theme;

    if (this.theme === 'system') {
      targetTheme = this.mediaQueryList?.matches ? 'dark' : 'light';
    }

    this.renderer.setAttribute(html, 'data-theme', targetTheme);
  }
}
