import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuessTheNumber } from './guess-the-number';

describe('GuessTheNumber', () => {
  let component: GuessTheNumber;
  let fixture: ComponentFixture<GuessTheNumber>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GuessTheNumber]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuessTheNumber);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
