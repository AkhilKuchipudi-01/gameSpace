import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WildCard } from './wild-card';

describe('WildCard', () => {
  let component: WildCard;
  let fixture: ComponentFixture<WildCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WildCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WildCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
