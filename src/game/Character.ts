import type { Direction, Position, SpriteName } from "./types";

const turnLeftFrom: Record<Direction, Direction> = {
  north: "west",
  west: "south",
  south: "east",
  east: "north",
};

const turnRightFrom: Record<Direction, Direction> = {
  north: "east",
  east: "south",
  south: "west",
  west: "north",
};

const deltaFor: Record<Direction, Position> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
};

export class Character {
  position: Position;
  direction: Direction;
  sprite: SpriteName;

  constructor(position: Position, direction: Direction, sprite: SpriteName) {
    this.position = { ...position };
    this.direction = direction;
    this.sprite = sprite;
  }

  clone() {
    return new Character(this.position, this.direction, this.sprite);
  }

  turnLeft() {
    this.direction = turnLeftFrom[this.direction];
  }

  turnRight() {
    this.direction = turnRightFrom[this.direction];
  }

  nextPosition() {
    const delta = deltaFor[this.direction];
    return {
      x: this.position.x + delta.x,
      y: this.position.y + delta.y,
    };
  }

  moveTo(position: Position) {
    this.position = { ...position };
  }
}
