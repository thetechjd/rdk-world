# PixiCityView drop-in for Vite/React

## 1. Install PixiJS

```bash
npm i pixi.js
```

## 2. Copy the component

Place `PixiCityView.jsx` in your Vite project, for example:

```txt
src/components/PixiCityView.jsx
```

## 3. Use it in your app

```jsx
import PixiCityView from "./components/PixiCityView";

export default function App() {
  return (
    <PixiCityView
      classKey="builder"
      completed={{ townhall: false, lab: false, bank: false, arena: false }}
      onEnter={(buildingId) => console.log("enter", buildingId)}
    />
  );
}
```

## 4. To connect it to your existing RDKWorld.jsx

Find the place where your current file renders:

```jsx
<CityView
  classKey={classKey}
  completed={completed}
  onEnter={setLocationOrCurrentBuildingFunction}
/>
```

Replace `CityView` with `PixiCityView` and import it:

```jsx
import PixiCityView from "./components/PixiCityView";
```

## 5. Why this is structured this way

This version still generates temporary pixel textures with Canvas so you can drop it in immediately without external art files.

Later, replace the generated texture functions with real PNG spritesheets exported from Aseprite, Piskel, LibreSprite, or Figma.

The key functions to replace later are:

- `createPlayerTextures()`
- `createBuildingTexture()`
- `createTileTexture()`
- `createDecorTexture()`

## 6. Recommended final asset structure

```txt
public/sprites/player-builder.png
public/sprites/player-affiliate.png
public/sprites/player-explorer.png
public/tiles/city-tileset.png
public/buildings/townhall.png
public/buildings/lab.png
public/buildings/bank.png
public/buildings/arena.png
public/buildings/portal.png
```
