export type Direction = "north" | "east" | "south" | "west";

export type Position = {
  x: number;
  y: number;
};

export type BasicCommand =
  | "move_forward"
  | "turn_left"
  | "turn_right"
  | "pick_object"
  | "drop_object";

export type CommandType = BasicCommand | "repeat_loop";

export type ProgramCommand =
  | {
      id: string;
      type: BasicCommand;
    }
  | {
      id: string;
      type: "repeat_loop";
      times: number;
      body: BasicCommand;
    };

export type SpriteName =
  | "littleRed"
  | "wolf"
  | "crow"
  | "monkey"
  | "rabbit"
  | "tortoise"
  | "lion"
  | "crocodile"
  | "grandmaHouse"
  | "well"
  | "pot"
  | "stone"
  | "mangoTree"
  | "mango"
  | "tree";

export type TileName = "grass" | "path";

export type BoardObjectKind = "stone" | "mango" | "pot" | "house" | "decoration";

export type BoardObject = {
  id: string;
  kind: BoardObjectKind;
  position: Position;
  sprite: SpriteName;
  collected?: boolean;
};

export type Obstacle = {
  id: string;
  kind: "wolf" | "tree" | "lion" | "crocodile";
  position: Position;
  sprite: SpriteName;
};

export type LevelGoal =
  | {
      type: "reach";
      position: Position;
      label: string;
    }
  | {
      type: "dropStones";
      position: Position;
      required: number;
      label: string;
    }
  | {
      type: "collectAll";
      itemKind: "mango" | "stone";
      label: string;
    }
  | {
      type: "collectAllAt";
      itemKind: "mango" | "stone";
      position: Position;
      label: string;
    };

export type LevelTheme = "red" | "crow" | "monkey" | "panchatantra";

export type RuntimeState = {
  character: {
    position: Position;
    direction: Direction;
    sprite: SpriteName;
  };
  objects: BoardObject[];
  inventory: {
    stones: number;
    mangoes: number;
  };
  stonesDropped: number;
  status: "ready" | "running" | "success" | "failed";
  message: string;
};

export type StepEvent =
  | "move"
  | "turn"
  | "pickup"
  | "drop"
  | "success"
  | "blocked"
  | "miss";

export type StepResult = {
  state: RuntimeState;
  event: StepEvent;
  from: Position;
  to: Position;
  message: string;
  command: BasicCommand;
};
