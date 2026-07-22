# webcam-draw

A webcam hand-drawing app using MediaPipe Hand Landmarker and HTML5 Canvas.

## Stack
- HTML / Vanilla JS
- MediaPipe Tasks-Vision (Hand Landmarker)
- HTML5 Canvas
- `getUserMedia` for webcam access

## Architecture notes
Drawing state is kept separate from rendering so this can be extended
into a multiplayer Pictionary game without major refactoring.

## Running
Open `index.html` in a browser (serve via a local HTTP server — webcam
requires a secure context or localhost).
