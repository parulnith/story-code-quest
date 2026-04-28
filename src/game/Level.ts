import { Grid } from "./Grid";
import type {
  BoardObject,
  Direction,
  LevelGoal,
  LevelTheme,
  Obstacle,
  Position,
  RuntimeState,
  SpriteName,
} from "./types";

type LevelConfig = {
  id: number;
  title: string;
  story: string;
  concept: string;
  grid: Grid;
  start: Position;
  direction: Direction;
  characterSprite: SpriteName;
  goal: LevelGoal;
  obstacles: Obstacle[];
  objects: BoardObject[];
  theme: LevelTheme;
  successText: string;
  starterProgram: string[];
};

export class Level {
  readonly id: number;
  readonly title: string;
  readonly story: string;
  readonly concept: string;
  readonly grid: Grid;
  readonly start: Position;
  readonly direction: Direction;
  readonly characterSprite: SpriteName;
  readonly goal: LevelGoal;
  readonly obstacles: Obstacle[];
  readonly objects: BoardObject[];
  readonly theme: LevelTheme;
  readonly successText: string;
  readonly starterProgram: string[];

  constructor(config: LevelConfig) {
    this.id = config.id;
    this.title = config.title;
    this.story = config.story;
    this.concept = config.concept;
    this.grid = config.grid;
    this.start = config.start;
    this.direction = config.direction;
    this.characterSprite = config.characterSprite;
    this.goal = config.goal;
    this.obstacles = config.obstacles;
    this.objects = config.objects;
    this.theme = config.theme;
    this.successText = config.successText;
    this.starterProgram = config.starterProgram;
  }

  createInitialState(): RuntimeState {
    return {
      character: {
        position: { ...this.start },
        direction: this.direction,
        sprite: this.characterSprite,
      },
      objects: this.objects.map((object) => ({
        ...object,
        position: { ...object.position },
        collected: false,
      })),
      inventory: {
        stones: 0,
        mangoes: 0,
      },
      stonesDropped: 0,
      status: "ready",
      message: "Build a command list and press Run.",
    };
  }
}
