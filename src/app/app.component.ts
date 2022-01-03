import { Component, OnDestroy, OnInit } from '@angular/core';

import { BehaviorSubject, filter, fromEvent, interval, map, Subject, switchMap, takeUntil, takeWhile } from 'rxjs';

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
  points = 0;
  currentLevel = 0;
  levelChange$ = new BehaviorSubject(0);
  countdown = 3;
  gameState$ = new Subject<GameState>();
  gameState = GameState;

  private cols = 10;
  private rows = 10;
  private direction!: Direction;
  private snake: number[] = [];
  private food: number[] = [];
  private blockedBlocks: number[] = [];
  private gameSpeed: number = 500;
  private gameSpeedSubject = new BehaviorSubject(this.gameSpeed);
  private speedSteps = 20;
  private goal = Infinity;
  private spawnFood: boolean = true;
  private colors = {
    snake: '#DBE000',
    food: '#32E070',
    blocker: '#888E94',
    free: 'black'
  };

  isHead(block: number): boolean {
    return this.snake[0] === block;
  }

  isFood(block: number): boolean {
    return this.food.includes(block);
  }

  ngOnInit(): void {
    this.subscribeToLevelChanges();
  }

  getLevelsForSelect(): number[] {
    return level.map((_, i) => i);
  }

  loadGamefieldAndStartCountdown(selectedLevel: number = 0): void {
    this.gameState$.next(GameState.restart);
    this.loadLevel(level[selectedLevel]);

    this.countdown = 3;
    interval(1000)
      .pipe(
        takeUntil(this.gameState$),
        takeWhile(_ => this.countdown > 0),
        map(_ => this.countdown--),
        filter(_ => this.countdown === 0))
      .subscribe(_ => {
        this.registerEventListeners();
        this.startGame();
      });
  }

  ngOnDestroy(): void {
    this.gameState$.next(GameState.gameover);
    this.gameState$.unsubscribe();
  }

  getGamefieldWidth(): number {
    return this.cols * this.getBlockSize();
  }

  getGamefieldHeight(): number {
    return this.rows * this.getBlockSize();
  }

  getColorForBlock(block: number): string {
    if (this.snake.includes(block)) {
      return this.colors.snake;
    }
    if (this.food.includes(block)) {
      return this.colors.food;
    }
    if (this.blockedBlocks.includes(block)) {
      return this.colors.blocker;
    }
    return this.colors.free;
  }

  isGameOver(gameState: GameState): boolean {
    return gameState === GameState.gameover;
  }

  isGameWon(gameState: GameState): boolean {
    return gameState === GameState.winning;
  }

  private subscribeToLevelChanges(): void {
    this.levelChange$.subscribe(level => {
      this.currentLevel = level;
      this.loadGamefieldAndStartCountdown(level);
      this.removeFocusFromLevelSelect();
    });
  }

  private removeFocusFromLevelSelect(): void {
    (document.querySelector('.level-select') as HTMLSelectElement).blur();
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
    const blockedPositions = [...this.snake, ...this.food, ...this.blockedBlocks];
    const ranomPosition = () => Math.floor(Math.random() * this.cols * this.rows);
    let position = ranomPosition();
    while (blockedPositions.includes(position)) {
      position = ranomPosition();
    }

    return position;
  }

  private startGame() {
    this.gameSpeedSubject
      .pipe(
        takeUntil(this.gameState$),
        switchMap(gameSpeed => interval(gameSpeed)
          .pipe(takeUntil(this.gameState$)))
      )
      .subscribe(_ => this.moveSnake());
  }

  private moveSnake(): void {
    const nextHead = this.getNextHeadPosition(this.snake[0], this.direction);
    const snakeIsDoingCannibalism = this.snake.includes(nextHead);
    const snakeIsEatingBlocker = this.blockedBlocks.includes(nextHead);

    if (snakeIsDoingCannibalism || snakeIsEatingBlocker) {
      this.gameState$.next(GameState.gameover);
      return;
    }

    const snakeHasToEat = this.food.includes(nextHead);
    this.snake.unshift(nextHead);

    snakeHasToEat ? this.eat(nextHead) : this.snake.pop();

    const playerWins = this.points === this.goal;
    if (playerWins) {
      this.gameState$.next(GameState.winning);
    }
  }

  private eat(nextHead: number): void {
    this.food = this.food.filter(f => f !== nextHead);
    if (this.spawnFood) {
      this.food.push(this.getRandomPosition());
    }
    this.points++;
    this.gameSpeed = this.gameSpeed - this.speedSteps / (this.points + 1);
    this.gameSpeedSubject.next(this.gameSpeed);
  }

  private getNextHeadPosition(index: number, direction: Direction): number {
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
      .pipe(
        takeUntil(this.gameState$)
      )
      .subscribe(keydownEvent => {
        const validateDirectionChange = (currentDirection: Direction, nextDirection: Direction): Direction => {
          if (
            currentDirection === Direction.left && nextDirection === Direction.right ||
            currentDirection === Direction.right && nextDirection === Direction.left ||
            currentDirection === Direction.up && nextDirection === Direction.down ||
            currentDirection === Direction.down && nextDirection === Direction.up
          ) {
            return currentDirection;
          }
          return nextDirection;
        }
        switch ((keydownEvent as KeyboardEvent).code) {
          case KeyCode.ArrowLeft: this.direction = validateDirectionChange(this.direction, Direction.left); break;
          case KeyCode.ArrowUp: this.direction = validateDirectionChange(this.direction, Direction.up); break;
          case KeyCode.ArrowRight: this.direction = validateDirectionChange(this.direction, Direction.right); break;
          case KeyCode.ArrowDown: this.direction = validateDirectionChange(this.direction, Direction.down); break;
        }
      }
      );
  }

  private getBlockSize(): number {
    return this.blockSize + (this.blockMargin * 2) + (this.blockBorderWidth * 2)
  }

  private loadLevel(level?: Level): void {
    this.gamefield = [];
    this.points = 0;
    this.rows = level?.rows ? level.rows : 10;
    this.cols = level?.cols ? level.cols : 10;
    this.snake = level?.snake ? [...level.snake] : this.getRandomSnake();
    this.food = level?.food ? [...level.food] : [this.getRandomPosition()];
    this.blockedBlocks = level?.blocker ? [...level.blocker] : [];
    this.direction = level?.direction ? level.direction : Direction.up;
    this.gameSpeed = level?.gameSpeed ? level.gameSpeed : 500;
    this.speedSteps = level?.speedSteps ? level.speedSteps : 20;
    this.goal = level?.goal ? level.goal : Infinity;
    this.spawnFood = level?.hasOwnProperty('spawnFood') ? !!level.spawnFood : true;
    this.blockSize = level?.blockSize ? level.blockSize : 35;

    let i = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.gamefield[i] = i;
        i++;
      }
    }
  }

}

enum GameState {
  restart,
  gameover,
  winning
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
  snake?: number[];
  food?: number[];
  blocker?: number[];
  rows?: number;
  cols?: number;
  direction?: Direction;
  gameSpeed?: number;
  speedSteps?: number;
  goal?: number;
  spawnFood?: boolean;
  blockSize?: number;
}

const level: Level[] = [
  {
    blockSize: 35,
    blocker: [],
    cols: 10,
    rows: 10,
    direction: Direction.right,
    food: [15],
    gameSpeed: 150,
    snake: [55, 54, 53],
    speedSteps: 20
  },
  {
    blocker: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
      10, 20, 30, 40, 50, 60, 70, 80, 90,
      19, 29, 39, 49, 59, 69, 79, 89, 99,
      91, 92, 93, 94, 95, 96, 97, 98
    ],
    cols: 10,
    rows: 10,
    direction: Direction.right,
    food: [15],
    gameSpeed: 500,
    snake: [55, 54, 53],
    speedSteps: 20
  },
  {
    blocker: [
      25, 28, 37, 40, 49, 50, 51, 52,
      31, 34, 43, 46, 55, 56, 57, 58,
      85, 88, 97, 100, 109, 110, 111, 112,
      91, 94, 103, 106, 115, 116, 117, 118
    ],
    cols: 12,
    rows: 12,
    direction: Direction.right,
    food: [38, 44, 98, 104],
    gameSpeed: 500,
    snake: [75, 74, 73],
    speedSteps: 20,
    goal: 4,
    spawnFood: false
  }
];