import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlyingBird } from './flying-bird';

describe('FlyingBird', () => {
  let component: FlyingBird;
  let fixture: ComponentFixture<FlyingBird>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FlyingBird]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlyingBird);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
