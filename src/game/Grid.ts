import type { Obstacle, Position, TileName } from "./types";

export class Grid {
  readonly width: number;
  readonly height: number;
  readonly path: Set<string>;

  constructor(width: number, height: number, path: Position[] = []) {
    this.width = width;
    this.height = height;
    this.path = new Set(path.map((position) => Grid.key(position)));
  }

  static key(position: Position) {
    return `${position.x},${position.y}`;
  }

  isInside(position: Position) {
    return (
      position.x >= 0 &&
      position.y >= 0 &&
      position.x < this.width &&
      position.y < this.height
    );
  }

  isObstacle(position: Position, obstacles: Obstacle[]) {
    return obstacles.some(
      (obstacle) =>
        obstacle.position.x === position.x && obstacle.position.y === position.y,
    );
  }

  tileFor(position: Position): TileName {
    return this.path.has(Grid.key(position)) ? "path" : "grass";
  }
}
