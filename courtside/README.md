# Courtside: NBA Matchup Lab

This is a separate personal simulator, not an analyst-project submission file.

## Open it

Run `python serve.py`, then open http://127.0.0.1:8767/ . Python 3 is the only server dependency. The app, statistics and Three.js are served locally; no API key or package installation is needed. Opening index.html directly as a file will not load browser modules/data correctly.

On this computer, the prepared environment is:

```powershell
& "C:\Users\fasim\Documents\Codex\2026-09-17\co\work\venv\Scripts\python.exe" serve.py
```

## Use it

- Search an offensive player and click/select their name.
- Search a different defensive player and select their name.
- Click anywhere on the full-court map, or focus the map and use the arrow keys.
- Choose defensive pressure, then click Take a shot (or Space when not editing a control).
- Reset score clears session results. Those results combine attempts across any matchups/positions you choose.

All 582 players in the 2025-26 regular-season source snapshot are included, with 219,160 shot locations. This is not an all-time player database or a live roster. Team assignments are the snapshot's labels, including players who changed teams; season totals can span teams. Players are generic procedural avatars, not scanned likenesses. Their heights, jersey numbers and uniforms follow the listed metadata.

## Statistical method and limits

The probability uses observed shots within five feet of the selected point, blended with league local and individual shot-type averages. Details and all coefficients appear under Data & method in the app. The player's printed FG% and 3P% are actual season totals. The simulated make chance is an estimate.

Defensive adjustment is a heuristic based on minutes-stabilized blocks and steals per 36 minutes, not direct matchup tracking or a causal defensive effect. Very deep shots use an explicit extrapolation. Smoothing and defensive coefficients were not fitted or validated against held-out outcomes. Do not represent the simulated probability as an official NBA statistic or the assignment's CatBoost output.

## Source and refresh

The included snapshot was retrieved 2026-09-20 from https://github.com/fuku8/nba-data, whose documentation identifies the NBA Stats API as its source. Inputs are data/player_totals.csv, data/player_profiles.csv, data/season.txt and the rs arrays in data/shots/*.json. Every player's attempts and makes were checked against their totals. The source's update schedule can differ from the retrieval date. See source_manifest.json for provenance and checksums.

`python refresh_data.py` downloads a new source snapshot and rewrites data.json only after all per-player count checks pass. It requires network access. It does not touch the analyst project's files. The bundled Three.js 0.160.1 license is in THREE-LICENSE.txt.

## Development

- index.html: layout and method explanation
- style.css: responsive styles
- app.js: search, full-court map, avatar/court rendering and animation
- model.js: probability calculations
- data.json: complete local player/shot snapshot
- tests.mjs: data-integrity and model-boundary tests (`node tests.mjs`)

Built with Codex assistance. User requests and implementation scope are recorded in ai_prompts.md.

The personal report embeds a copy under nba-shot-project/courtside/. After editing this standalone app, copy the updated files there to update the embedded version. The assignment-only files are separately preserved under outputs/submission-ready/.

## WebXR VR mode

Open the app in a browser that reports immersive-vr support (compatible Quest, PC VR, or Safari on supported Vision Pro software). Select players first, then Enter VR. Controllers use select/trigger; transient-pointer devices such as Vision Pro use look-and-pinch. Point/select the in-world SHOOT, PRESSURE, RESET, RECENTER or EXIT VR buttons. Point/select the floor to teleport. Headset system controls can also end the session. Player changes are made outside VR. This is probability-based shooting, not a tracked throwing-physics simulation.

VR needs a secure context. Localhost works only on the device serving/accessing localhost (for example a PC with a connected headset). A standalone headset needs the app served at a reachable trusted HTTPS URL; the current local development server does not provide that. No public hosting or certificate bypass was configured. Open full-screen if the embedded view cannot request VR. An unsupported browser retains the complete desktop app.

Implemented against WebXR capability detection, with local-floor/local reference-space fallback and transient target-ray input. Hardware behavior remains unverified; no claim of compatibility with every headset or browser is made. References: https://webkit.org/blog/15865/webkit-features-in-safari-18-0/ and https://threejs.org/docs/pages/WebXRManager.html .

## Hot zones
Select either matchup player to view observed shooting percentages in custom geometric zones. Every attempt is assigned once, including deep/backcourt attempts. Makes/attempts, league comparison and low-sample labels accompany all percentages. The supplied screenshot is retained in assets/hot-zones-reference.jpg as a visual reference. These ratings are descriptive heuristics, not official ratings or exact matchup percentages.

## Gameplay
Hold and release the shot button or Space; target 850 ms. Quick shot and VR omit timing. Defender follows movement, closes on a charge and jumps at release. Three-point contest has 15 shots at five automatic positions; the timed round lasts 60 seconds; race to ten ends at ten makes. Session zone totals last for this page visit and can be cleared separately from the score. Comparison uses both matchup players. Enable sound unmutes synthesized effects. Run node gameplay-tests.mjs for controller checks.
