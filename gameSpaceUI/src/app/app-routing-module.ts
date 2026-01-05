import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RockPaperScissors } from './components/rock-paper-scissors/rock-paper-scissors';
import { GuessTheNumber } from './components/guess-the-number/guess-the-number';
import { FlyingBird } from './components/flying-bird/flying-bird';

const routes: Routes = [
  { path: '', redirectTo: 'rps', pathMatch: 'full' },
  { path: 'rps', component: RockPaperScissors },
  { path: 'guess', component: GuessTheNumber },
  { path: 'bird', component: FlyingBird }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
