import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RockPaperScissors } from './rock-paper-scissors';

describe('RockPaperScissors', () => {
  let component: RockPaperScissors;
  let fixture: ComponentFixture<RockPaperScissors>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RockPaperScissors]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RockPaperScissors);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
