import React, { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

/*
  PixiCityView.jsx
  Drop-in Vite/React PixiJS city scene for RDK WORLD.

  Install:
    npm i pixi.js

  Use:
    import PixiCityView from "./components/PixiCityView";

    <PixiCityView
      classKey="builder"
      completed={{ townhall:false, lab:false, bank:false, arena:false }}
      onEnter={(buildingId) => console.log(buildingId)}
    />

  This component intentionally generates temporary pixel-art textures with Canvas.
  Later, replace createPlayerTexture/createBuildingTexture/createTileTexture with
  PIXI.Assets.load('/sprites/player-builder.png') and real spritesheets.
*/

const TILE = 32;
const MAP_W = 24;
const MAP_H = 18;
const WORLD_W = MAP_W * TILE;
const WORLD_H = MAP_H * TILE;

const PAL = {
  bg: "#0f0d14",
  panel: "#1b1623",
  text: "#f4efff",
  dim: "#b7abc8",

  grass: "#355c3a",
  grassDark: "#263f2a",
  grassLight: "#4b7650",

  road: "#70624b",
  roadDark: "#514637",
  roadLight: "#8a795e",

  fence: "#5a3f28",
  water: "#2f6f91",
  waterDark: "#204b67",

  cyan: "#59c3ff",
  pink: "#ff5cc8",
  gold: "#e6c15f",
  green: "#79e27d",
  red: "#ff6b6b",
  ink: "#09070d",
  warm: "#ffd785",
};

const CLASS_META = {
  affiliate: { name: "AFFILIATE", color: PAL.pink },
  builder: { name: "BUILDER", color: PAL.cyan },
  explorer: { name: "EXPLORER", color: PAL.gold },
};

const BUILDINGS = [
  { id: "townhall", name: "TOWN HALL", x: 3, y: 3, w: 4, h: 3, door: { dx: 1, dy: 3 }, color: PAL.gold, kind: "townhall" },
  { id: "lab", name: "THE LAB", x: 14, y: 3, w: 4, h: 3, door: { dx: 1, dy: 3 }, color: PAL.cyan, kind: "lab" },
  { id: "bank", name: "THE BANK", x: 3, y: 10, w: 4, h: 3, door: { dx: 1, dy: 3 }, color: PAL.green, kind: "bank" },
  { id: "arena", name: "THE ARENA", x: 12, y: 10, w: 4, h: 3, door: { dx: 1, dy: 3 }, color: PAL.red, kind: "arena" },
  // Portal door is below the visible body, so it is reachable from the road.
  { id: "portal", name: "THE PORTAL", x: 9, y: 15, w: 5, h: 2, door: { dx: 2, dy: 2 }, color: PAL.pink, kind: "portal" },
];

const DECOR = [
  { type: "tree", x: 2, y: 1 }, { type: "tree", x: 11, y: 1 },
  { type: "tree", x: 20, y: 1 }, { type: "tree", x: 20, y: 7 },
  { type: "tree", x: 1, y: 14 }, { type: "tree", x: 21, y: 13 },
  { type: "bush", x: 18, y: 7 }, { type: "bush", x: 9, y: 7 },
  { type: "bush", x: 2, y: 8 }, { type: "bush", x: 21, y: 8 },
  { type: "flower", x: 8, y: 2 }, { type: "flower", x: 17, y: 2 },
  { type: "flower", x: 7, y: 14 }, { type: "flower", x: 16, y: 14 },
  { type: "flower", x: 19, y: 16 }, { type: "flower", x: 2, y: 16 },
];

const ROADS = new Set();
[
  ...[6, 7, 8].flatMap((y) => [[4, y], [5, y]]),
  ...[6, 7, 8].flatMap((y) => [[15, y], [16, y]]),
  ...Array.from({ length: 13 }, (_, i) => [4 + i, 8]),
  ...[13, 14].flatMap((y) => [[4, y], [5, y]]),
  ...[13, 14].flatMap((y) => [[13, y], [14, y]]),
  ...Array.from({ length: 11 }, (_, i) => [4 + i, 14]),
  [10, 15], [11, 15], [12, 15], [10, 16], [11, 16], [12, 16],
].forEach(([x, y]) => ROADS.add(`${x},${y}`));

function getTileAt(x, y) {
  if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return { type: "void", blocked: true };

  // Doors must be checked before building body collision, including portal door below its sprite.
  for (const b of BUILDINGS) {
    if (x === b.x + b.door.dx && y === b.y + b.door.dy) {
      return { type: "door", buildingId: b.id, blocked: true };
    }
  }

  if (x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1) return { type: "fence", blocked: true };
  if (x === MAP_W - 2 && y === MAP_H - 2) return { type: "water", blocked: true };

  const decor = DECOR.find((d) => d.x === x && d.y === y);
  if (decor && (decor.type === "tree" || decor.type === "bush")) return { type: decor.type, blocked: true };

  for (const b of BUILDINGS) {
    const inside = x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h;
    if (inside) return { type: "building", blocked: true };
  }

  if (ROADS.has(`${x},${y}`)) return { type: "road", blocked: false };
  return { type: "grass", blocked: false };
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function hexToNumber(hex) {
  return Number(`0x${hex.replace("#", "")}`);
}

function makeCanvas(w, h, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  draw(ctx, w, h);
  return canvas;
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function createTexture(w, h, draw) {
  return PIXI.Texture.from(makeCanvas(w, h, draw));
}

function createTileTexture(type, variant = 0) {
  return createTexture(TILE, TILE, (ctx) => {
    const p = 2; // pixel block size for a low-res authored feel
    if (type === "grass") {
      rect(ctx, 0, 0, TILE, TILE, PAL.grass);
      rect(ctx, 0, TILE - p, TILE, p, PAL.grassDark);
      rect(ctx, TILE - p, 0, p, TILE, PAL.grassDark);
      const flecks = [
        [[4, 4, PAL.grassLight], [20, 8, PAL.grassDark], [10, 22, PAL.grassDark], [26, 26, PAL.grassLight]],
        [[2, 16, PAL.grassDark], [14, 6, PAL.grassLight], [22, 20, PAL.grassDark], [8, 28, PAL.grassLight]],
        [[6, 10, PAL.grassLight], [16, 24, PAL.grassDark], [28, 12, PAL.grassDark], [12, 2, PAL.grassLight]],
      ][variant % 3];
      flecks.forEach(([x, y, c]) => rect(ctx, x, y, p, p, c));
      return;
    }

    if (type === "road") {
      rect(ctx, 0, 0, TILE, TILE, PAL.road);
      rect(ctx, 0, 0, TILE, p, PAL.roadLight);
      rect(ctx, 0, TILE - p, TILE, p, PAL.roadDark);
      rect(ctx, TILE - p, 0, p, TILE, PAL.roadDark);
      rect(ctx, 6, 8, 5, p, PAL.roadDark);
      rect(ctx, 20, 18, 6, p, PAL.roadDark);
      rect(ctx, 12, 26, p, p, PAL.roadLight);
      return;
    }

    if (type === "fence") {
      rect(ctx, 0, 0, TILE, TILE, PAL.grassDark);
      rect(ctx, 0, 12, TILE, 4, PAL.fence);
      rect(ctx, 0, 22, TILE, 4, "#3f2a1a");
      [2, 12, 22].forEach((x) => {
        rect(ctx, x, 8, 4, 20, "#6b4a2e");
        rect(ctx, x, 8, 4, 2, "#8b6743");
      });
      return;
    }

    if (type === "water") {
      rect(ctx, 0, 0, TILE, TILE, PAL.water);
      rect(ctx, 0, 24, TILE, 8, PAL.waterDark);
      rect(ctx, 4, 8, 10, 2, "#65a7c9");
      rect(ctx, 18, 18, 8, 2, "#65a7c9");
      return;
    }
  });
}

function createDecorTexture(type, color = PAL.pink) {
  return createTexture(TILE, TILE, (ctx) => {
    if (type === "tree") {
      rect(ctx, 14, 20, 6, 10, "#5d3b22");
      rect(ctx, 12, 24, 10, 4, "#402817");
      rect(ctx, 8, 4, 16, 4, "#1f3d25");
      rect(ctx, 6, 8, 20, 8, "#2f5a35");
      rect(ctx, 4, 14, 24, 8, "#27482d");
      rect(ctx, 10, 8, 4, 2, "#4f7d54");
      rect(ctx, 20, 14, 2, 2, "#4f7d54");
      return;
    }
    if (type === "bush") {
      rect(ctx, 4, 18, 24, 8, "#203d25");
      rect(ctx, 6, 14, 20, 6, "#2f5a35");
      rect(ctx, 10, 12, 10, 2, "#3f6d45");
      rect(ctx, 10, 18, 2, 2, "#5f8d64");
      rect(ctx, 22, 16, 2, 2, "#5f8d64");
      return;
    }
    if (type === "flower") {
      rect(ctx, 14, 18, 2, 8, "#315c35");
      rect(ctx, 16, 22, 4, 2, "#315c35");
      rect(ctx, 14, 12, 2, 2, color);
      rect(ctx, 12, 14, 2, 2, color);
      rect(ctx, 16, 14, 2, 2, color);
      rect(ctx, 14, 16, 2, 2, color);
      rect(ctx, 14, 14, 2, 2, PAL.warm);
    }
  });
}

function createBuildingTexture(building, completed) {
  const w = building.w * TILE;
  const h = building.h * TILE;
  return createTexture(w, h, (ctx) => {
    const accent = building.color;
    const side = "rgba(0,0,0,0.35)";
    const light = "rgba(255,255,255,0.18)";

    // shadow
    rect(ctx, 8, h - 10, w - 10, 8, "rgba(0,0,0,0.38)");

    if (building.kind === "townhall") {
      rect(ctx, 10, 30, w - 20, h - 34, "#5a4f65");
      rect(ctx, 10, 30, 12, h - 34, "#746984");
      rect(ctx, w - 22, 30, 12, h - 34, side);
      triangle(ctx, 4, 32, w / 2, 6, w - 4, 32, "#40284d");
      triangle(ctx, 14, 30, w / 2, 12, w - 14, 30, "#664277");
      rect(ctx, 18, 38, w - 36, 6, "#92869e");
      [28, 52, 76].filter((x) => x < w - 18).forEach((x) => rect(ctx, x, 50, 8, h - 66, "#786d88"));
      rect(ctx, w / 2 - 10, h - 28, 20, 24, "#2a2033");
      rect(ctx, w / 2 - 2, h - 16, 4, 4, PAL.warm);
    }

    if (building.kind === "lab") {
      rect(ctx, 10, 26, w - 20, h - 30, "#26364a");
      rect(ctx, 10, 26, 10, h - 30, "#3b5269");
      rect(ctx, w - 20, 26, 10, h - 30, side);
      rect(ctx, 6, 20, w - 12, 12, "#1b2737");
      rect(ctx, w / 2 - 2, 2, 4, 20, accent);
      rect(ctx, w / 2 - 10, 2, 20, 4, accent);
      [24, 50, 76].filter((x) => x < w - 18).forEach((x) => windowBlock(ctx, x, 44, accent));
      [36, 66].filter((x) => x < w - 18).forEach((x) => windowBlock(ctx, x, 68, PAL.green));
      rect(ctx, w / 2 - 10, h - 28, 20, 24, "#101722");
      rect(ctx, w / 2 + 4, h - 16, 4, 4, accent);
    }

    if (building.kind === "bank") {
      rect(ctx, 8, 32, w - 16, h - 36, "#45434c");
      rect(ctx, 8, 32, 12, h - 36, "#5c5964");
      rect(ctx, w - 20, 32, 12, h - 36, side);
      rect(ctx, 4, 20, w - 8, 14, "#7e6842");
      rect(ctx, 12, 14, w - 24, 8, accent);
      rect(ctx, w / 2 - 20, 44, 40, 28, "#2d2d35");
      rect(ctx, w / 2 - 14, 50, 28, 16, "#686573");
      rect(ctx, w / 2 - 10, h - 28, 20, 24, "#14131a");
      rect(ctx, w / 2 + 4, h - 16, 4, 4, PAL.green);
    }

    if (building.kind === "arena") {
      rect(ctx, 8, 32, w - 16, h - 36, "#5f483d");
      rect(ctx, 8, 32, 12, h - 36, "#7b5b4c");
      rect(ctx, w - 20, 32, 12, h - 36, side);
      triangle(ctx, 2, 32, w / 2, 10, w - 2, 32, "#631f28");
      triangle(ctx, 14, 30, w / 2, 16, w - 14, 30, accent);
      rect(ctx, w / 2 - 28, 42, 56, 14, PAL.ink);
      rect(ctx, w / 2 - 22, 46, 44, 4, accent);
      rect(ctx, w / 2 - 10, h - 28, 20, 24, PAL.ink);
      rect(ctx, w / 2 + 4, h - 16, 4, 4, accent);
    }

    if (building.kind === "portal") {
      rect(ctx, 10, 20, w - 20, h - 22, "#22172e");
      rect(ctx, 10, 20, 10, h - 22, "#38254a");
      rect(ctx, w - 20, 20, 10, h - 22, side);
      rect(ctx, 4, 14, w - 8, 10, "#40284d");
      rect(ctx, w / 2 - 26, 30, 52, h - 36, "#100817");
      [0, 1, 2, 3, 4].forEach((i) => rect(ctx, w / 2 - 18 + i * 8, 36 + (i % 2) * 8, 6, 24, i % 2 ? PAL.cyan : PAL.pink));
      rect(ctx, w / 2 - 10, h - 20, 20, 18, "#050309");
    }

    if (completed) {
      rect(ctx, w - 16, 6, 10, 10, PAL.gold);
      rect(ctx, w - 12, 10, 2, 2, PAL.ink);
    }

    // global rim light
    rect(ctx, 0, 0, w, 2, light);
  });
}

function triangle(ctx, x1, y1, x2, y2, x3, y3, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

function windowBlock(ctx, x, y, color) {
  rect(ctx, x, y, 10, 10, color);
  rect(ctx, x + 2, y + 2, 4, 2, "rgba(255,255,255,0.75)");
}

function createPlayerFrameTexture(classColor, dir, frame) {
  return createTexture(TILE, TILE, (ctx) => {
    const coat = classColor;
    const skin = "#d79a72";
    const hair = "#211516";
    const boot = "#171018";
    const step = frame === 1;

    ctx.globalAlpha = 0.42;
    rect(ctx, 6, 28, 20, 3, "#000000");
    ctx.globalAlpha = 1;

    rect(ctx, step ? 8 : 10, 26, 6, 4, boot);
    rect(ctx, step ? 20 : 16, 26, 6, 4, boot);

    rect(ctx, 8, 14, 16, 12, coat);
    ctx.globalAlpha = 0.18;
    rect(ctx, 8, 14, 4, 12, "#ffffff");
    ctx.globalAlpha = 0.28;
    rect(ctx, 20, 14, 4, 12, "#000000");
    ctx.globalAlpha = 1;

    rect(ctx, 10, 8, 12, 8, skin);
    rect(ctx, 8, 6, 16, 4, hair);
    rect(ctx, 10, 4, 12, 2, coat);
    rect(ctx, 6, 6, 20, 2, coat);

    if (dir === "down") {
      rect(ctx, 12, 12, 2, 2, PAL.ink);
      rect(ctx, 18, 12, 2, 2, PAL.ink);
    } else if (dir === "left") {
      rect(ctx, 10, 12, 2, 2, PAL.ink);
      rect(ctx, 7, 16, 2, 6, coat);
    } else if (dir === "right") {
      rect(ctx, 20, 12, 2, 2, PAL.ink);
      rect(ctx, 24, 16, 2, 6, coat);
    } else {
      rect(ctx, 12, 8, 8, 4, hair);
    }

    // small backpack terminal
    rect(ctx, 24, 18, 4, 6, "#2b2234");
    rect(ctx, 26, 20, 2, 2, PAL.cyan);
  });
}

function createPlayerTextures(classColor) {
  const dirs = ["down", "left", "right", "up"];
  const out = {};
  dirs.forEach((dir) => {
    out[dir] = [createPlayerFrameTexture(classColor, dir, 0), createPlayerFrameTexture(classColor, dir, 1)];
  });
  return out;
}

function makeText(text, style) {
  // Constructor signature differs across Pixi versions. This form works in v7
  // and is also accepted by v8.
  return new PIXI.Text(text, style);
}

function drawTextLabel(text, color, size = 10) {
  const label = makeText(text, {
    fontFamily: "'Press Start 2P', monospace",
    fontSize: size,
    fill: color,
    align: "center",
  });
  label.roundPixels = true;
  return label;
}

function createGlow(color, radius = 64) {
  const c = createTexture(radius, radius, (ctx, w, h) => {
    const rgb = hexToRgb(color);
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},0.45)`);
    g.addColorStop(0.45, `rgba(${rgb.r},${rgb.g},${rgb.b},0.18)`);
    g.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  return new PIXI.Sprite(c);
}

function createOverlayTexture(type) {
  return createTexture(WORLD_W, WORLD_H, (ctx, w, h) => {
    if (type === "fog") {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = PAL.text;
      ctx.save();
      ctx.translate(-120, 0);
      ctx.rotate(-0.45);
      for (let i = -20; i < 42; i += 1) {
        ctx.fillRect(i * 36, 0, 2, h * 2);
      }
      ctx.restore();
      ctx.globalAlpha = 1;
      return;
    }

    if (type === "scan") {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }
      return;
    }

    if (type === "vignette") {
      const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.62);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.7, "rgba(0,0,0,0.25)");
      g.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  });
}

export default function PixiCityView({
  classKey = "builder",
  completed = {},
  onEnter = () => {},
}) {
  const hostRef = useRef(null);
  const onEnterRef = useRef(onEnter);
  onEnterRef.current = onEnter;

  useEffect(() => {
    let disposed = false;
    let app;
    const host = hostRef.current;
    if (!host) return undefined;

    const meta = CLASS_META[classKey] || CLASS_META.builder;
    const portalUnlocked = ["townhall", "lab", "bank", "arena"].every((id) => completed[id]);

    async function boot() {
      const appOptions = {
        width: WORLD_W,
        height: WORLD_H,
        background: PAL.bg,
        backgroundColor: hexToNumber(PAL.bg),
        antialias: false,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
      };

      // Pixi v8 uses async app.init(). Pixi v7 uses constructor options.
      // Supporting both prevents the "blank canvas" problem when a project has
      // a different Pixi major version installed.
      if (PIXI.Application.prototype.init) {
        app = new PIXI.Application();
        await app.init(appOptions);
      } else {
        app = new PIXI.Application(appOptions);
      }

      if (disposed) {
        const canvas = app?.canvas || app?.view;
        if (canvas?.parentNode) canvas.parentNode.removeChild(canvas);
        app = null;
        return;
      }

      const canvas = app.canvas || app.view;
      if (!canvas) throw new Error("PixiJS did not create a canvas/view.");

      canvas.style.width = "100%";
      canvas.style.maxWidth = `${WORLD_W}px`;
      canvas.style.height = "auto";
      canvas.style.display = "block";
      canvas.style.imageRendering = "pixelated";
      canvas.tabIndex = 0;
      canvas.setAttribute("role", "application");
      canvas.setAttribute("aria-label", "RDK World PixiJS city scene");
      host.appendChild(canvas);
      canvas.focus();

      const world = new PIXI.Container();
      world.sortableChildren = true;
      app.stage.addChild(world);

      const tileTextures = {
        grass0: createTileTexture("grass", 0),
        grass1: createTileTexture("grass", 1),
        grass2: createTileTexture("grass", 2),
        road: createTileTexture("road"),
        fence: createTileTexture("fence"),
        water: createTileTexture("water"),
      };

      for (let y = 0; y < MAP_H; y += 1) {
        for (let x = 0; x < MAP_W; x += 1) {
          const isFence = x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1;
          const isWater = x === MAP_W - 2 && y === MAP_H - 2;
          const isRoad = ROADS.has(`${x},${y}`);
          const variant = (x * 7 + y * 13) % 3;
          const texture = isFence
            ? tileTextures.fence
            : isWater
              ? tileTextures.water
              : isRoad
                ? tileTextures.road
                : tileTextures[`grass${variant}`];
          const s = new PIXI.Sprite(texture);
          s.x = x * TILE;
          s.y = y * TILE;
          s.zIndex = y;
          world.addChild(s);
        }
      }

      const decorTextures = {
        tree: createDecorTexture("tree"),
        bush: createDecorTexture("bush"),
        flowerPink: createDecorTexture("flower", PAL.pink),
        flowerGold: createDecorTexture("flower", PAL.gold),
      };

      DECOR.forEach((d, i) => {
        const texture = d.type === "flower" ? (i % 2 ? decorTextures.flowerGold : decorTextures.flowerPink) : decorTextures[d.type];
        const s = new PIXI.Sprite(texture);
        s.x = d.x * TILE;
        s.y = d.y * TILE;
        s.zIndex = d.y * 10 + 20;
        world.addChild(s);
      });

      BUILDINGS.forEach((b) => {
        const glow = createGlow(b.color, 96);
        glow.x = b.x * TILE + (b.w * TILE) / 2 - 48;
        glow.y = b.y * TILE + 8;
        glow.alpha = b.id === "portal" && !portalUnlocked ? 0.08 : 0.22;
        glow.zIndex = b.y * 10 + 80;
        world.addChild(glow);

        const s = new PIXI.Sprite(createBuildingTexture(b, Boolean(completed[b.id])));
        s.x = b.x * TILE;
        s.y = b.y * TILE;
        s.zIndex = b.y * 10 + 100;
        world.addChild(s);

        const label = drawTextLabel(b.name, PAL.text, 7);
        label.x = b.x * TILE + (b.w * TILE - label.width) / 2;
        label.y = b.y * TILE + b.h * TILE + 2;
        label.zIndex = b.y * 10 + 140;
        world.addChild(label);
      });

      const playerTextures = createPlayerTextures(meta.color);
      const player = new PIXI.Sprite(playerTextures.down[0]);
      player.anchor.set(0, 0);
      player.x = 11 * TILE;
      player.y = 14 * TILE; // road tile, not inside portal collision
      player.zIndex = 999;
      world.addChild(player);

      const state = {
        x: 11,
        y: 14,
        dir: "down",
        frame: 0,
        hint: null,
      };

      const hintBg = new PIXI.Graphics();
      hintBg.zIndex = 2000;
      hintBg.visible = false;
      world.addChild(hintBg);

      const hintText = drawTextLabel("", PAL.text, 8);
      hintText.zIndex = 2001;
      hintText.visible = false;
      world.addChild(hintText);

      const title = makeText("RDK\nWORLD", {
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 16,
        fill: meta.color,
        align: "left",
        lineHeight: 26,
        letterSpacing: 2,
      });
      title.x = 16;
      title.y = 14;
      title.zIndex = 5000;
      app.stage.addChild(title);

      const subtitle = makeText(`${meta.name} · ARROWS/WASD TO MOVE · SPACE TO ENTER`, {
        fontFamily: "'VT323', 'Courier New', monospace",
        fontSize: 18,
        fill: PAL.dim,
      });
      subtitle.x = 16;
      subtitle.y = 72;
      subtitle.zIndex = 5000;
      app.stage.addChild(subtitle);

      const overlay = new PIXI.Container();
      overlay.zIndex = 4000;
      app.stage.addChild(overlay);

      const fog = new PIXI.Sprite(createOverlayTexture("fog"));
      fog.alpha = 0.14;
      overlay.addChild(fog);

      const scan = new PIXI.Sprite(createOverlayTexture("scan"));
      scan.alpha = 0.16;
      overlay.addChild(scan);

      const vignette = new PIXI.Sprite(createOverlayTexture("vignette"));
      vignette.alpha = 0.55;
      overlay.addChild(vignette);

      function showHint(text, color, bid) {
        state.hint = { text, color, bid };
        hintText.text = text;
        hintText.style.fill = color;
        hintText.x = Math.max(8, Math.min(player.x - TILE, WORLD_W - hintText.width - 18));
        hintText.y = Math.max(96, player.y - 26);
        hintText.visible = true;

        hintBg.clear();
        hintBg.beginFill(hexToNumber(PAL.bg), 1);
        hintBg.drawRect(hintText.x - 6, hintText.y - 5, hintText.width + 12, hintText.height + 10);
        hintBg.endFill();
        hintBg.lineStyle(2, hexToNumber(color), 1);
        hintBg.drawRect(hintText.x - 6, hintText.y - 5, hintText.width + 12, hintText.height + 10);
        hintBg.visible = true;
      }

      function hideHint() {
        state.hint = null;
        hintText.visible = false;
        hintBg.visible = false;
      }

      function checkAdjacentDoors() {
        const around = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        for (const [dx, dy] of around) {
          const t = getTileAt(state.x + dx, state.y + dy);
          if (t.type === "door") {
            const b = BUILDINGS.find((item) => item.id === t.buildingId);
            if (t.buildingId === "portal" && !portalUnlocked) {
              showHint("PORTAL SEALED · FINISH 4 BUILDINGS", PAL.red, null);
            } else {
              showHint(`▶ ${b.name}  [SPACE]`, b.color, b.id);
            }
            return;
          }
        }
        hideHint();
      }

      function move(dx, dy) {
        const nx = state.x + dx;
        const ny = state.y + dy;
        state.dir = dy === 1 ? "down" : dy === -1 ? "up" : dx === 1 ? "right" : "left";

        const tile = getTileAt(nx, ny);
        if (tile.type === "door") {
          const b = BUILDINGS.find((item) => item.id === tile.buildingId);
          if (tile.buildingId === "portal" && !portalUnlocked) {
            showHint("PORTAL SEALED · FINISH 4 BUILDINGS", PAL.red, null);
          } else {
            showHint(`▶ ${b.name}  [SPACE]`, b.color, b.id);
          }
          player.texture = playerTextures[state.dir][state.frame];
          return;
        }
        if (tile.blocked) {
          player.texture = playerTextures[state.dir][state.frame];
          return;
        }

        state.x = nx;
        state.y = ny;
        state.frame = state.frame ? 0 : 1;
        player.x = state.x * TILE;
        player.y = state.y * TILE;
        player.texture = playerTextures[state.dir][state.frame];
        player.zIndex = state.y * 10 + 300;
        checkAdjacentDoors();
      }

      function onKeyDown(e) {
        const key = e.key.toLowerCase();
        if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(key)) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (key === "arrowup" || key === "w") move(0, -1);
        else if (key === "arrowdown" || key === "s") move(0, 1);
        else if (key === "arrowleft" || key === "a") move(-1, 0);
        else if (key === "arrowright" || key === "d") move(1, 0);
        else if (key === " " && state.hint?.bid) onEnterRef.current(state.hint.bid);
      }

      document.addEventListener("keydown", onKeyDown, true);
      canvas.addEventListener("pointerdown", () => canvas.focus());
      checkAdjacentDoors();

      let fogT = 0;
      app.ticker.add((ticker) => {
        fogT += ticker.deltaTime;
        fog.x = Math.sin(fogT / 80) * 26;
      });

      app.__cleanup = () => {
        document.removeEventListener("keydown", onKeyDown, true);
      };
    }

    boot().catch((err) => {
      console.error("PixiCityView failed to boot:", err);
      if (host && !disposed) {
        host.innerHTML = `<div style="padding:16px;color:#ff6b6b;font-family:monospace;background:#0f0d14;min-height:220px;box-sizing:border-box;">PixiCityView failed to boot: ${String(err?.message || err)}</div>`;
      }
    });

    return () => {
      disposed = true;
    
      try {
        if (app?.__cleanup) app.__cleanup();
    
        const canvas = app?.canvas || app?.view;
        if (canvas?.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
    
        // Do NOT call app.destroy() in React dev StrictMode here.
        // Pixi v8 can throw: this._cancelResize is not a function
        app = null;
      } catch (err) {
        console.warn("Pixi cleanup skipped:", err);
      }
    
      if (host) host.innerHTML = "";
    };
  }, [classKey, completed]);

  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        maxWidth: WORLD_W,
        margin: "0 auto",
        border: `4px solid ${PAL.ink}`,
        boxShadow: "10px 12px 0 rgba(0,0,0,0.48)",
        background: PAL.bg,
        minHeight: WORLD_H,
        outline: "none",
      }}
    />
  );
}
