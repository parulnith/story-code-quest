import { useMemo, useRef, useState } from "react";
import { CommandEditor } from "./CommandEditor";
import { GameBoard } from "./GameBoard";
import { StoryPanel } from "./StoryPanel";
import { CommandInterpreter } from "../game/CommandInterpreter";
import { levels } from "../game/levels";
import type {
  BasicCommand,
  Position,
  ProgramCommand,
  RuntimeState,
} from "../game/types";

const stepDelay = 260;
const moveDuration = 420;

export function LevelManager() {
  const [levelIndex, setLevelIndex] = useState(0);
  const level = levels[levelIndex];
  const [state, setState] = useState<RuntimeState>(() => level.createInitialState());
  const [program, setProgram] = useState<ProgramCommand[]>([]);
  const [hintStep, setHintStep] = useState(0);
  const [visualPosition, setVisualPosition] = useState<Position>(() => ({ ...level.start }));
  const [isRunning, setIsRunning] = useState(false);
  const [pulse, setPulse] = useState(0);
  const runTokenRef = useRef(0);
  const interpreter = useMemo(() => new CommandInterpreter(level), [level]);

  const selectLevel = (index: number) => {
    runTokenRef.current += 1;
    const nextLevel = levels[index];
    setLevelIndex(index);
    setState(nextLevel.createInitialState());
    setProgram([]);
    setHintStep(0);
    setVisualPosition({ ...nextLevel.start });
    setIsRunning(false);
  };

  const resetBoard = () => {
    runTokenRef.current += 1;
    const initial = level.createInitialState();
    setState(initial);
    setVisualPosition({ ...level.start });
    setIsRunning(false);
  };

  const resetLevel = () => {
    resetBoard();
    setProgram([]);
    setHintStep(0);
  };

  const revealHint = () => {
    const nextHint = level.starterProgram[hintStep];
    if (!nextHint) {
      return;
    }

    resetBoard();
    setProgram((currentProgram) => [
      ...currentProgram,
      parseStarterCommand(nextHint),
    ]);
    setHintStep((currentStep) => currentStep + 1);
  };

  const runProgram = async () => {
    if (isRunning) {
      return;
    }

    const token = runTokenRef.current + 1;
    runTokenRef.current = token;
    setIsRunning(true);

    let current = level.createInitialState();
    setState({ ...current, status: "running", message: "Running..." });
    setVisualPosition({ ...level.start });
    await sleep(stepDelay);

    const expanded = interpreter.expand(program);
    for (const command of expanded) {
      if (runTokenRef.current !== token) {
        return;
      }

      const result = interpreter.execute(command, current);
      if (result.event === "move") {
        await animateMove(result.from, result.to, token);
      } else if (result.event === "blocked") {
        await animateBump(result.from, result.to, token);
      } else {
        setPulse((value) => value + 1);
        await sleep(stepDelay);
      }

      current = result.state;
      setState(current);
      setVisualPosition({ ...current.character.position });

      if (current.status === "success" || current.status === "failed") {
        setIsRunning(false);
        return;
      }

      await sleep(stepDelay);
    }

    const finished = {
      ...current,
      status: current.status === "success" ? "success" : "ready",
      message:
        current.status === "success"
          ? current.message
          : "Program ended before the goal.",
    } satisfies RuntimeState;
    setState(finished);
    setIsRunning(false);
  };

  const animateMove = (from: Position, to: Position, token: number) => {
    const startedAt = performance.now();

    return new Promise<void>((resolve) => {
      const frame = (now: number) => {
        if (runTokenRef.current !== token) {
          resolve();
          return;
        }

        const progress = Math.min((now - startedAt) / moveDuration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setVisualPosition({
          x: from.x + (to.x - from.x) * eased,
          y: from.y + (to.y - from.y) * eased,
        });
        setPulse((value) => value + 1);

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(frame);
    });
  };

  const animateBump = async (from: Position, to: Position, token: number) => {
    const blocked = {
      x: from.x + (to.x - from.x) * 0.16,
      y: from.y + (to.y - from.y) * 0.16,
    };
    setVisualPosition(blocked);
    setPulse((value) => value + 1);
    await sleep(140);
    if (runTokenRef.current === token) {
      setVisualPosition(from);
    }
    await sleep(160);
  };

  const nextLevel = () => {
    if (levelIndex < levels.length - 1) {
      selectLevel(levelIndex + 1);
    }
  };

  return (
    <div className="app-frame">
      <header className="intro-banner">
        <div className="intro-heading">
          <p className="eyebrow">Story Code Quest</p>
          <h1 className="intro-title">Read the story. Solve it with code.</h1>
        </div>
        <p>
          Familiar tales become logic puzzles where kids decide what the
          character should do next, arrange commands, and watch their plan play
          out on the board.
        </p>
      </header>

      <main className="app-shell">
        <StoryPanel
          level={level}
          levelCount={levels.length}
          levelIndex={levelIndex}
          onSelectLevel={selectLevel}
          state={state}
        />

        <div className="center-column">
          <GameBoard
            level={level}
            pulse={pulse}
            state={state}
            visualPosition={visualPosition}
          />
          {state.status === "success" && (
            <div className="complete-banner">
              <strong>Level complete</strong>
              {levelIndex < levels.length - 1 ? (
                <button onClick={nextLevel} type="button">
                  Next
                </button>
              ) : (
                <span>All stories solved.</span>
              )}
            </div>
          )}
        </div>

        <CommandEditor
          defaultRepeatBody={
            level.goal.type === "dropStones" ? "drop_object" : "move_forward"
          }
          isRunning={isRunning}
          hasHint={hintStep < level.starterProgram.length}
          onHint={revealHint}
          onProgramChange={setProgram}
          onReset={resetLevel}
          onRun={runProgram}
          program={program}
        />
      </main>
    </div>
  );
}

function parseStarterCommand(value: string): ProgramCommand {
  const [type, times, body] = value.split(":");
  if (type === "repeat_loop") {
    return {
      id: crypto.randomUUID(),
      type,
      times: Number(times),
      body: body as BasicCommand,
    };
  }

  return {
    id: crypto.randomUUID(),
    type: type as BasicCommand,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
