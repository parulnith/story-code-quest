import { Level } from "../game/Level";
import type { RuntimeState } from "../game/types";

type StoryPanelProps = {
  level: Level;
  state: RuntimeState;
  levelIndex: number;
  levelCount: number;
  onSelectLevel: (index: number) => void;
};

export function StoryPanel({
  level,
  state,
  levelIndex,
  levelCount,
  onSelectLevel,
}: StoryPanelProps) {
  const mangoCount = state.objects.filter(
    (object) => object.kind === "mango" && object.collected,
  ).length;
  const totalMangoes = state.objects.filter((object) => object.kind === "mango")
    .length;

  return (
    <aside className={`panel story-panel theme-${level.theme}`}>
      <div className="level-tabs" aria-label="Levels">
        {Array.from({ length: levelCount }, (_, index) => (
          <button
            className={index === levelIndex ? "active-tab" : ""}
            key={index}
            onClick={() => onSelectLevel(index)}
            type="button"
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div className="story-card">
        <p className="eyebrow">Puzzle {level.id}</p>
        <h1>{level.title}</h1>
        <p className="story-copy">{level.story}</p>
      </div>

      <div className="facts">
        <div>
          <span>Logic</span>
          <strong>{level.concept}</strong>
        </div>
        <div>
          <span>Goal</span>
          <strong>{level.goal.label}</strong>
        </div>
        {level.goal.type === "dropStones" && (
          <div>
            <span>Water</span>
            <strong>
              {state.stonesDropped}/{level.goal.required} stones
            </strong>
          </div>
        )}
        {level.goal.type === "collectAll" && (
          <div>
            <span>Mangoes</span>
            <strong>
              {mangoCount}/{totalMangoes} collected
            </strong>
          </div>
        )}
        {(state.inventory.stones > 0 || level.goal.type === "dropStones") && (
          <div>
            <span>Carrying</span>
            <strong>{state.inventory.stones} stones</strong>
          </div>
        )}
      </div>

      <p className={`status status-${state.status}`}>{state.message}</p>
    </aside>
  );
}
