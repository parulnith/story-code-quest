import { Character } from "./Character";
import { Grid } from "./Grid";
import type {
  BasicCommand,
  ProgramCommand,
  RuntimeState,
  StepResult,
} from "./types";
import { Level } from "./Level";

export class CommandInterpreter {
  private readonly level: Level;

  constructor(level: Level) {
    this.level = level;
  }

  expand(program: ProgramCommand[]): BasicCommand[] {
    return program.flatMap((command) => {
      if (command.type !== "repeat_loop") {
        return [command.type];
      }

      return Array.from({ length: command.times }, () => command.body);
    });
  }

  execute(command: BasicCommand, state: RuntimeState): StepResult {
    const nextState = this.cloneState(state);
    const character = new Character(
      nextState.character.position,
      nextState.character.direction,
      nextState.character.sprite,
    );
    const from = { ...character.position };
    let message = "";

    if (command === "turn_left") {
      character.turnLeft();
      nextState.character.direction = character.direction;
      message = "Turned left.";
      return this.withGoalCheck({
        state: nextState,
        event: "turn",
        from,
        to: { ...from },
        message,
        command,
      });
    }

    if (command === "turn_right") {
      character.turnRight();
      nextState.character.direction = character.direction;
      message = "Turned right.";
      return this.withGoalCheck({
        state: nextState,
        event: "turn",
        from,
        to: { ...from },
        message,
        command,
      });
    }

    if (command === "move_forward") {
      const target = character.nextPosition();
      if (
        !this.level.grid.isInside(target) ||
        this.level.grid.isObstacle(target, this.level.obstacles)
      ) {
        nextState.status = "failed";
        nextState.message = "Oops. That step hits a blocked tile.";
        return {
          state: nextState,
          event: "blocked",
          from,
          to: target,
          message: nextState.message,
          command,
        };
      }

      character.moveTo(target);
      nextState.character.position = { ...target };
      message = "Moved forward.";
      return this.withGoalCheck({
        state: nextState,
        event: "move",
        from,
        to: { ...target },
        message,
        command,
      });
    }

    const pickupResult =
      command === "drop_object"
        ? this.dropObject(nextState)
        : this.pickObject(nextState);
    return this.withGoalCheck({
      state: pickupResult.state,
      event: pickupResult.event,
      from,
      to: { ...from },
      message: pickupResult.message,
      command,
    });
  }

  private pickObject(state: RuntimeState) {
    const position = state.character.position;
    const object = state.objects.find(
      (item) =>
        !item.collected &&
        item.position.x === position.x &&
        item.position.y === position.y,
    );

    if (object?.kind === "stone") {
      object.collected = true;
      state.inventory.stones += 1;
      state.message = "Stone picked up.";
      return { state, event: "pickup" as const, message: state.message };
    }

    if (object?.kind === "mango") {
      object.collected = true;
      state.inventory.mangoes += 1;
      state.message = "Mango collected.";
      return { state, event: "pickup" as const, message: state.message };
    }

    state.message = "Nothing to pick up here.";
    return { state, event: "miss" as const, message: state.message };
  }

  private dropObject(state: RuntimeState) {
    const position = state.character.position;
    const object = state.objects.find(
      (item) =>
        !item.collected &&
        item.position.x === position.x &&
        item.position.y === position.y,
    );

    if (
      object?.kind === "pot" &&
      state.inventory.stones > 0 &&
      this.level.goal.type === "dropStones"
    ) {
      state.inventory.stones -= 1;
      state.stonesDropped += 1;
      state.message = "Dropped a stone into the pot.";
      return { state, event: "drop" as const, message: state.message };
    }

    if (object?.kind === "pot") {
      state.message = "No stones to drop yet.";
      return { state, event: "miss" as const, message: state.message };
    }

    state.message = "Nothing to drop here.";
    return { state, event: "miss" as const, message: state.message };
  }

  private withGoalCheck(result: StepResult): StepResult {
    if (result.state.status === "failed") {
      return result;
    }

    const { goal } = this.level;
    const position = result.state.character.position;

    if (
      goal.type === "reach" &&
      position.x === goal.position.x &&
      position.y === goal.position.y
    ) {
      result.state.status = "success";
      result.state.message = this.level.successText;
      return { ...result, event: "success", message: this.level.successText };
    }

    if (
      goal.type === "dropStones" &&
      result.state.stonesDropped >= goal.required &&
      position.x === goal.position.x &&
      position.y === goal.position.y
    ) {
      result.state.status = "success";
      result.state.message = this.level.successText;
      return { ...result, event: "success", message: this.level.successText };
    }

    if (
      goal.type === "collectAll" &&
      this.hasCollectedAll(result.state, goal.itemKind)
    ) {
      result.state.status = "success";
      result.state.message = this.level.successText;
      return { ...result, event: "success", message: this.level.successText };
    }

    if (
      goal.type === "collectAllAt" &&
      this.hasCollectedAll(result.state, goal.itemKind) &&
      position.x === goal.position.x &&
      position.y === goal.position.y
    ) {
      result.state.status = "success";
      result.state.message = this.level.successText;
      return { ...result, event: "success", message: this.level.successText };
    }

    result.state.status = "running";
    result.state.message = result.message;
    return result;
  }

  private hasCollectedAll(state: RuntimeState, itemKind: "mango" | "stone") {
    return state.objects
      .filter((object) => object.kind === itemKind)
      .every((object) => object.collected);
  }

  private cloneState(state: RuntimeState): RuntimeState {
    return {
      ...state,
      character: {
        ...state.character,
        position: { ...state.character.position },
      },
      objects: state.objects.map((object) => ({
        ...object,
        position: { ...object.position },
      })),
      inventory: { ...state.inventory },
    };
  }
}
