import type {
  BasicCommand,
  CommandType,
  ProgramCommand,
} from "../game/types";

type CommandEditorProps = {
  program: ProgramCommand[];
  isRunning: boolean;
  onProgramChange: (program: ProgramCommand[]) => void;
  onRun: () => void;
  onReset: () => void;
  onHint: () => void;
  hasHint: boolean;
  defaultRepeatBody: BasicCommand;
};

const commands: CommandType[] = [
  "move_forward",
  "turn_left",
  "turn_right",
  "pick_object",
  "drop_object",
  "repeat_loop",
];

const repeatBodies: BasicCommand[] = [
  "move_forward",
  "turn_left",
  "turn_right",
  "pick_object",
  "drop_object",
];

const makeCommand = (
  type: CommandType,
  defaultRepeatBody: BasicCommand,
): ProgramCommand => {
  if (type === "repeat_loop") {
    return {
      id: crypto.randomUUID(),
      type,
      times: 2,
      body: defaultRepeatBody,
    };
  }

  return { id: crypto.randomUUID(), type };
};

export function CommandEditor({
  program,
  isRunning,
  onProgramChange,
  onRun,
  onReset,
  onHint,
  hasHint,
  defaultRepeatBody,
}: CommandEditorProps) {
  const addCommand = (type: CommandType) => {
    onProgramChange([...program, makeCommand(type, defaultRepeatBody)]);
  };

  const moveCommand = (index: number, offset: number) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= program.length) {
      return;
    }

    const next = [...program];
    const [command] = next.splice(index, 1);
    next.splice(nextIndex, 0, command);
    onProgramChange(next);
  };

  const removeCommand = (id: string) => {
    onProgramChange(program.filter((command) => command.id !== id));
  };

  const updateRepeat = (
    id: string,
    update: Partial<Extract<ProgramCommand, { type: "repeat_loop" }>>,
  ) => {
    onProgramChange(
      program.map((command) =>
        command.id === id && command.type === "repeat_loop"
          ? { ...command, ...update }
          : command,
      ),
    );
  };

  return (
    <aside className="panel command-panel">
      <div className="panel-heading">
        <p className="eyebrow">Program</p>
        <h2>Command Editor</h2>
      </div>

      <div className="command-palette" aria-label="Commands available">
        {commands.map((command) => (
          <button
            className={`command-chip chip-${command}`}
            disabled={isRunning}
            key={command}
            onClick={() => addCommand(command)}
            type="button"
          >
            {command}
          </button>
        ))}
      </div>

      <ol className="program-list" aria-label="Arranged commands">
        {program.length === 0 && (
          <li className="empty-program">No commands yet.</li>
        )}
        {program.map((command, index) => (
          <li className="program-step" key={command.id}>
            <span className="step-number">{index + 1}</span>
            <div className="step-body">
              <code>{command.type}</code>
              {command.type === "repeat_loop" && (
                <div className="repeat-controls">
                  <label>
                    x
                    <input
                      disabled={isRunning}
                      max={5}
                      min={2}
                      onChange={(event) =>
                        updateRepeat(command.id, {
                          times: Number(event.target.value),
                        })
                      }
                      type="number"
                      value={command.times}
                    />
                  </label>
                  <select
                    disabled={isRunning}
                    onChange={(event) =>
                      updateRepeat(command.id, {
                        body: event.target.value as BasicCommand,
                      })
                    }
                    value={command.body}
                  >
                    {repeatBodies.map((body) => (
                      <option key={body} value={body}>
                        {body}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="step-actions">
              <button
                aria-label="Move command up"
                disabled={isRunning}
                onClick={() => moveCommand(index, -1)}
                type="button"
              >
                ↑
              </button>
              <button
                aria-label="Move command down"
                disabled={isRunning}
                onClick={() => moveCommand(index, 1)}
                type="button"
              >
                ↓
              </button>
              <button
                aria-label="Remove command"
                disabled={isRunning}
                onClick={() => removeCommand(command.id)}
                type="button"
              >
                ×
              </button>
            </div>
          </li>
        ))}
      </ol>

      <div className="editor-actions">
        <button
          className="secondary-button"
          disabled={isRunning || !hasHint}
          onClick={onHint}
          type="button"
        >
          Hint
        </button>
        <button
          className="secondary-button"
          disabled={isRunning}
          onClick={onReset}
          type="button"
        >
          Reset
        </button>
        <button
          className="run-button"
          disabled={isRunning || program.length === 0}
          onClick={onRun}
          type="button"
        >
          Run
        </button>
      </div>
    </aside>
  );
}
