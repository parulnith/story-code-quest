import { useEffect, useMemo, useRef } from "react";
import { Grid } from "../game/Grid";
import { Level } from "../game/Level";
import type { Direction, Position, RuntimeState, SpriteName, TileName } from "../game/types";

type GameBoardProps = {
  level: Level;
  state: RuntimeState;
  visualPosition: Position;
  pulse: number;
};

const spriteSources: Record<SpriteName, string> = {
  littleRed: "/assets/sprites/little-red.png",
  wolf: "/assets/sprites/wolf.png",
  crow: "/assets/sprites/crow.png",
  monkey: "/assets/sprites/monkey.png",
  rabbit: "/assets/sprites/rabbit.png",
  tortoise: "/assets/sprites/tortoise.png",
  lion: "/assets/sprites/lion.png",
  crocodile: "/assets/sprites/crocodile.png",
  grandmaHouse: "/assets/sprites/grandma-house.png",
  well: "/assets/sprites/well.png",
  pot: "/assets/sprites/pot.png",
  stone: "/assets/sprites/stone.png",
  mangoTree: "/assets/sprites/mango-tree.png",
  mango: "/assets/sprites/mango.png",
  tree: "/assets/sprites/tree.png",
};

const tileSources: Record<TileName, string> = {
  grass: "/assets/tiles/grass.png",
  path: "/assets/tiles/path.png",
};

const directionAngle: Record<Direction, number> = {
  north: -Math.PI / 2,
  east: 0,
  south: Math.PI / 2,
  west: Math.PI,
};

export function GameBoard({
  level,
  state,
  visualPosition,
  pulse,
}: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCache = useMemo(() => new Map<string, HTMLImageElement>(), []);

  useEffect(() => {
    [...Object.values(spriteSources), ...Object.values(tileSources)].forEach(
      (source) => {
        if (imageCache.has(source)) {
          return;
        }

        const image = new Image();
        image.src = source;
        image.onload = () => drawBoard();
        imageCache.set(source, image);
      },
    );
  }, [imageCache]);

  useEffect(() => {
    drawBoard();
  }, [level, state, visualPosition, pulse]);

  const drawBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const size = Math.min(canvas.width / level.grid.width, canvas.height / level.grid.height);
    const boardWidth = size * level.grid.width;
    const boardHeight = size * level.grid.height;
    const offsetX = (canvas.width - boardWidth) / 2;
    const offsetY = (canvas.height - boardHeight) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff8da";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawTiles(ctx, level.grid, size, offsetX, offsetY);
    drawPathGlow(ctx, level.grid, size, offsetX, offsetY);
    drawObjects(ctx, size, offsetX, offsetY);
    drawObstacles(ctx, size, offsetX, offsetY);
    drawCharacter(ctx, size, offsetX, offsetY);
    drawGridLines(ctx, level.grid, size, offsetX, offsetY);
  };

  const drawTiles = (
    ctx: CanvasRenderingContext2D,
    grid: Grid,
    size: number,
    offsetX: number,
    offsetY: number,
  ) => {
    for (let y = 0; y < grid.height; y += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const tile = grid.tileFor({ x, y });
        const image = imageCache.get(tileSources[tile]);
        if (image?.complete) {
          ctx.drawImage(image, offsetX + x * size, offsetY + y * size, size, size);
        } else {
          ctx.fillStyle = tile === "path" ? "#eec46b" : "#9be05f";
          ctx.fillRect(offsetX + x * size, offsetY + y * size, size, size);
        }
      }
    }
  };

  const drawPathGlow = (
    ctx: CanvasRenderingContext2D,
    grid: Grid,
    size: number,
    offsetX: number,
    offsetY: number,
  ) => {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    ctx.lineWidth = 4;
    grid.path.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      ctx.strokeRect(
        offsetX + x * size + 6,
        offsetY + y * size + 6,
        size - 12,
        size - 12,
      );
    });
    ctx.restore();
  };

  const drawObjects = (
    ctx: CanvasRenderingContext2D,
    size: number,
    offsetX: number,
    offsetY: number,
  ) => {
    state.objects.forEach((object) => {
      if (object.collected) {
        return;
      }

      const scale =
        object.kind === "pot" || object.kind === "house" || object.kind === "decoration"
          ? 0.9
          : 0.56;
      const image = imageCache.get(spriteSources[object.sprite]);
      drawSprite(ctx, image, object.position, size, offsetX, offsetY, scale);

      if (object.kind === "pot" && level.goal.type === "dropStones") {
        const progress = state.stonesDropped / level.goal.required;
        drawWaterMeter(ctx, object.position, size, offsetX, offsetY, progress);
      }
    });
  };

  const drawObstacles = (
    ctx: CanvasRenderingContext2D,
    size: number,
    offsetX: number,
    offsetY: number,
  ) => {
    level.obstacles.forEach((obstacle) => {
      const image = imageCache.get(spriteSources[obstacle.sprite]);
      drawSprite(ctx, image, obstacle.position, size, offsetX, offsetY, 0.82);
    });
  };

  const drawCharacter = (
    ctx: CanvasRenderingContext2D,
    size: number,
    offsetX: number,
    offsetY: number,
  ) => {
    const bob = Math.sin(pulse / 8) * 2;
    const image = imageCache.get(spriteSources[state.character.sprite]);
    drawSprite(ctx, image, { x: visualPosition.x, y: visualPosition.y + bob / size }, size, offsetX, offsetY, 0.72);
    drawFacingArrow(ctx, visualPosition, state.character.direction, size, offsetX, offsetY);
  };

  return (
    <section className="board-shell" aria-label="Game board">
      <canvas
        className="game-canvas"
        height={720}
        ref={canvasRef}
        width={760}
      />
    </section>
  );
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  position: Position,
  tileSize: number,
  offsetX: number,
  offsetY: number,
  scale: number,
) {
  const size = tileSize * scale;
  const x = offsetX + position.x * tileSize + (tileSize - size) / 2;
  const y = offsetY + position.y * tileSize + (tileSize - size) / 2;

  if (image?.complete) {
    ctx.drawImage(image, x, y, size, size);
    return;
  }

  ctx.fillStyle = "#f49c42";
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawFacingArrow(
  ctx: CanvasRenderingContext2D,
  position: Position,
  direction: Direction,
  tileSize: number,
  offsetX: number,
  offsetY: number,
) {
  const centerX = offsetX + position.x * tileSize + tileSize / 2;
  const centerY = offsetY + position.y * tileSize + tileSize * 0.17;
  const angle = directionAngle[direction];

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);
  ctx.fillStyle = "#144c8a";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tileSize * 0.18, 0);
  ctx.lineTo(-tileSize * 0.12, -tileSize * 0.12);
  ctx.lineTo(-tileSize * 0.06, 0);
  ctx.lineTo(-tileSize * 0.12, tileSize * 0.12);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}

function drawGridLines(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  size: number,
  offsetX: number,
  offsetY: number,
) {
  ctx.save();
  ctx.strokeStyle = "rgba(91, 72, 42, 0.2)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= grid.width; x += 1) {
    ctx.beginPath();
    ctx.moveTo(offsetX + x * size, offsetY);
    ctx.lineTo(offsetX + x * size, offsetY + grid.height * size);
    ctx.stroke();
  }
  for (let y = 0; y <= grid.height; y += 1) {
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY + y * size);
    ctx.lineTo(offsetX + grid.width * size, offsetY + y * size);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWaterMeter(
  ctx: CanvasRenderingContext2D,
  position: Position,
  tileSize: number,
  offsetX: number,
  offsetY: number,
  progress: number,
) {
  const width = tileSize * 0.46;
  const height = tileSize * 0.12;
  const x = offsetX + position.x * tileSize + tileSize * 0.27;
  const y = offsetY + position.y * tileSize + tileSize * 0.74;

  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.strokeStyle = "#244f79";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#4cc9f0";
  ctx.beginPath();
  ctx.roundRect(x + 3, y + 3, (width - 6) * progress, height - 6, 6);
  ctx.fill();
  ctx.restore();
}
