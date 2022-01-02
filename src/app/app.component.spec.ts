import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { TranslateModule } from '@ngx-translate/core';

import { AppComponent } from './app.component';

const selectors = {
  levelSelect: '.level-select',
  levelOptions: 'option'
}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        FormsModule,
        TranslateModule.forRoot()
      ],
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display a level select', () => {
    const levelOptions = fixture.nativeElement.querySelectorAll(selectors.levelOptions) as HTMLOptionsCollection;

    expect(levelOptions[0].value).toBe('0');
  });

  it('should load level and set game data when level is changed', done => {
    const levelSelect = fixture.nativeElement.querySelector(selectors.levelSelect) as HTMLSelectElement;

    levelSelect.value = levelSelect.options[1].value;
    levelSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    component.levelChange$.subscribe(level => {
      expect(level.toString()).toBe('1');
      expect(component.gamefield.length).toBe(100);
      done();
    });
  });
});
