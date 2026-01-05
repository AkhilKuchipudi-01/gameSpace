import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { RockPaperScissors } from './components/rock-paper-scissors/rock-paper-scissors';
import { FlyingBird } from './components/flying-bird/flying-bird';
import { GuessTheNumber } from './components/guess-the-number/guess-the-number';

@NgModule({
  declarations: [
    App,
    RockPaperScissors,
    FlyingBird,
    GuessTheNumber
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners()
  ],
  bootstrap: [App]
})
export class AppModule { }
