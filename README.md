# KnitGrid

KnitGrid is a lightweight browser-based tool for creating and editing knitting charts. It focuses on a simple visual workflow: set a grid size, pick stitches and colors, and paint directly on the chart until it matches your pattern.

## Features

**Chart setup**
- Create charts with custom row and column counts (1–200).
- **New Chart** resets the grid, title, and view; **Clear** empties all cells while keeping your palettes.

**Stitches and colors**
- Add custom stitch symbols (abbreviation + symbol character), with optional presets such as knit, purl, and yarn over.
- Build a session color palette with quick picks, hex entry, or the system color picker.
- Edit or remove custom stitches and colors from the sidebar (see Usage).
- Separate tools for painting stitches, painting cell background color, and erasing stitch or color.

**Drawing and editing**
- Click or drag on the chart to paint the active stitch or color.
- Rectangular **Select** mode with copy, cut, paste, horizontal flip, and vertical flip on the selection.
- Undo and redo for chart edits, including palette changes when you edit or remove stitches and colors.

**Presentation**
- Editable chart title above the grid.
- Row and column labels using knitting-style numbering (shown at sensible intervals on the grid).
- Live **stitch legend** below the chart listing symbols that appear in the grid.

**View and export**
- **Fit** scales the chart to the workspace (up to 100%); manual zoom steps from 25% to 200%.
- Export the chart as **PNG** or **JPG**, including title, grid, and legend, via a file name you choose.

## Usage

1. Set **Rows** and **Columns**, then click **New Chart** (or press **Enter** in either dimension field).
2. Use **+** under Stitches or Color to add tools, or select the eraser to clear stitches or background color on the grid.
3. Choose a stitch or color swatch and draw on the canvas; drag to paint multiple cells in one stroke.
4. Turn on **Select** to drag a rectangle, then use the toolbar actions for copy/cut/paste or flip. With **Copy**, draw a new rectangle where you want to paste. **Delete** or **Backspace** clears the selected region. **Escape** exits selection mode.
5. Click the chart title to rename it (default: “Untitled Chart”).
6. Click **Export**, choose a file name and format, and download the image.

**Tips**
- **Right-click** a custom stitch or color swatch in the sidebar for **Edit** or **Remove**. Removing updates the chart and can be undone.
- **Fit** keeps the whole chart visible in the workspace; zoom **+** / **−** switches to fixed zoom levels. Resizing the window refits when Fit is active.
- Keyboard shortcuts (when focus is not in a text field): **⌘/Ctrl+C**, **⌘/Ctrl+X**, **⌘/Ctrl+V** for copy, cut, and paste in selection mode.

## Getting Started

You need [Node.js](https://nodejs.org/) to install dependencies and run the dev server.

```bash
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

Other scripts:

```bash
npm run build    # typecheck and production build to dist/
npm run preview  # serve the production build locally
```

## Tech Stack

- TypeScript
- [Vite](https://vite.dev/) for dev server and bundling
- HTML, CSS, and the Canvas API (no UI framework)

## Project Structure

Source lives under `src/`:

- `main.ts` — application wiring and UI event handlers
- `chart/` — grid model, history, numbering, zoom
- `editing/` — painting and tool state
- `selection/` — rectangular selection, clipboard, flip/paste
- `render/` — canvas drawing for the chart and legend
- `export/` — off-screen render and image download
- `symbols/` and `colors/` — stitch registry and color helpers
- `ui/` — dialogs, palettes, title editor, context menu
- `styles/` — layout and component styles

## Design Notes

KnitGrid is intentionally small and focused: the workspace stays centered on the chart, while stitches, colors, and chart dimensions live in the sidebar and toolbar. Zoom and Fit only change how you view and edit the chart in the browser; exported images are rendered separately at a fixed cell size, so they do not depend on your current zoom level.
