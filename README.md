# Game AI Lab

A static browser-based arcade and visual bot playground. Designed for GitHub Pages.

## Deploy on GitHub Pages
1. Create a GitHub repository.
2. Upload the contents of this folder to the repository root.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**, select `main` and `/ (root)`.
5. Open the published URL.

No build step, backend, API key, account, or paid service is required. Chess uses chess.js from a CDN, so an internet connection is needed for the chess rules engine.

## Included
- Chess (human vs built-in bot)
- Connect Four (human vs built-in bot)
- 3D-perspective Pong (keyboard controls)
- Neon Racer (keyboard controls)
- Visual node editor with draggable nodes and connectable ports
- Import/export bot blueprints as JSON
- Download the default bot strategy collection
- Arena for quick bot-vs-bot simulations

## Controls
- Chess / Connect Four: mouse
- Pong: W/S or ↑/↓
- Racer: A/D or ←/→

## Blueprint nodes
Start, Game Input, Variable, List, Math, Compare, Logic, Choose, Game Output.

The editor is an extensible starter runtime. The built-in game opponents currently use native game-specific strategy functions; the node runtime is provided for experimenting with blueprint logic and can be extended with more game actions.
