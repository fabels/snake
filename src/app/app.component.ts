import { Component, OnDestroy, OnInit } from '@angular/core';

import { BehaviorSubject, fromEvent, interval, Subject, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  gamefield!: number[];
  blockSize = 35;
  blockMargin = 1;
  blockBorderWidth = 0;

  private destroy$ = new Subject<void>();
  private cols = 10;
  private rows = 10;
  private direction!: Direction;
  private snake: number[] = [];
  private food: number[] = [];
  private blocker: number[] = [];
  private gameSpeed: number = 500;
  private gameSpeedSubject = new BehaviorSubject(this.gameSpeed);
  private speedSteps = 20;

  ngOnInit(): void {
    this.start();
  }

  start(): void {
    this.destroy$.next();
    this.initGame(level[0]);
    this.registerEventListeners();
    this.startGame();
  }

  getHeadRotation(): number {
    switch (this.direction) {
      case Direction.up: return 90;
      case Direction.right: return 180;
      case Direction.down: return 270;
      case Direction.left: return 0;
    }
  }

  isHead(index: number): boolean {
    return this.snake[0] === index;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  getGamefieldWidth(): number {
    return this.cols * this.getBlockSize();
  }

  getGamefieldHeight(): number {
    return this.rows * this.getBlockSize();
  }

  getColor(field: number): string {
    if (this.snake.includes(field)) {
      return '#DBE000';
    }
    if (this.food.includes(field)) {
      return '#32E070';
    }
    if (this.blocker.includes(field)) {
      return '#888E94';
    }
    return 'transparent';
  }

  private getRandomSnake(): number[] {
    const snake = [];
    let head = this.getRandomPosition();
    for (let i = head; i < head + 3; i++) {
      snake.push(i);
    }
    return snake;
  }

  private getRandomPosition(): number {
    const blockedPositions = [...this.snake, ...this.food, ...this.blocker];
    let position = Math.floor(Math.random() * this.cols * this.rows);
    while (blockedPositions.includes(position)) {
      position = Math.floor(Math.random() * this.cols * this.rows);
    }

    return position;
  }

  private startGame() {
    this.gameSpeedSubject
      .pipe(takeUntil(this.destroy$),
        switchMap(gameSpeed => interval(gameSpeed).pipe(takeUntil(this.destroy$))))
      .subscribe(_ => this.moveSnake());
  }

  private moveSnake(): void {
    const nextHead = this.getNextPosition(this.snake[0], this.direction);
    const snakeHasToEat = this.food.includes(nextHead);
    const snakeIsDoingCannibalism = this.snake.includes(nextHead);
    const snakeIsEatingBlocker = this.blocker.includes(nextHead);
    this.snake.unshift(nextHead);

    if (snakeIsDoingCannibalism || snakeIsEatingBlocker) {
      this.destroy$.next();
    }

    if (!snakeHasToEat) {
      this.snake.pop();
    }

    if (snakeHasToEat) {
      this.eat(nextHead);
    }
  }

  private eat(nextHead: number): void {
    this.food = this.food.filter(f => f !== nextHead);
    this.food.push(this.getRandomPosition());
    this.gameSpeed = this.gameSpeed - this.speedSteps;
    this.gameSpeedSubject.next(this.gameSpeed);
  }

  private getNextPosition(index: number, direction: Direction): number {
    const row = Math.floor(index / this.rows);
    const rowStart = row * this.cols;
    const rowEnd = rowStart + this.cols - 1;
    const col = index - row * this.cols;

    switch (direction) {
      case Direction.right:
        return index + 1 > rowEnd ? rowStart : index + 1;
      case Direction.left:
        return index - 1 < rowStart ? rowEnd : index - 1;
      case Direction.up:
        return index - this.cols >= 0 ? index - this.cols : (this.rows * (this.cols - 1)) + col;
      case Direction.down:
        return index + this.cols < this.gamefield.length ? index + this.cols : col;
    }
  }

  private registerEventListeners(): void {
    fromEvent(document, 'keydown')
      .pipe(takeUntil(this.destroy$))
      .subscribe(keydownEvent => {
        switch ((keydownEvent as KeyboardEvent).code) {
          case KeyCode.ArrowLeft: this.direction = Direction.left; break;
          case KeyCode.ArrowUp: this.direction = Direction.up; break;
          case KeyCode.ArrowRight: this.direction = Direction.right; break;
          case KeyCode.ArrowDown: this.direction = Direction.down; break;
        }
      }
      );
  }

  private getBlockSize(): number {
    return this.blockSize + (this.blockMargin * 2) + (this.blockBorderWidth * 2)
  }

  private initGame(level?: Level): void {
    this.gamefield = [];
    this.rows = level?.rows ? level.rows : 10;
    this.cols = level?.cols ? level.cols : 10;
    this.snake = level?.snake ? level.snake : this.getRandomSnake();
    this.food = level?.food ? level.food : [this.getRandomPosition()];
    this.blocker = level?.blocker ? level.blocker : [];
    this.direction = level?.direction ? level.direction : Direction.up;
    this.gameSpeed = level?.gameSpeed ? level.gameSpeed : 500;
    this.speedSteps = level?.speedSteps ? level.speedSteps : 20;

    let i = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.gamefield[i] = i;
        i++;
      }
    }
  }

}

enum KeyCode {
  ArrowLeft = 'ArrowLeft',
  ArrowUp = 'ArrowUp',
  ArrowRight = 'ArrowRight',
  ArrowDown = 'ArrowDown'
}

enum Direction {
  up, left, down, right
}

interface Level {
  snake: number[];
  food: number[];
  blocker: number[];
  rows: number;
  cols: number;
  direction: Direction;
  gameSpeed: number;
  speedSteps: number;
}

const level: Level[] = [
  {
    blocker: [],
    cols: 10,
    rows: 10,
    direction: Direction.right,
    food: [15],
    gameSpeed: 500,
    snake: [55, 54, 53],
    speedSteps: 20
  },
  {
    blocker: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 19, 29, 39, 49, 59, 69, 79, 89, 99, 91, 92, 93, 94, 95, 96, 97, 98],
    cols: 10,
    rows: 10,
    direction: Direction.right,
    food: [15],
    gameSpeed: 500,
    snake: [55, 54, 53],
    speedSteps: 20
  }
];