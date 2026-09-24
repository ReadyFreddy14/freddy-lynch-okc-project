# Freddy Lynch · OKC basketball project

[Explore the live website](https://readyfreddy14.github.io/freddy-lynch-okc-project/)

This site brings two related pieces of work together:

1. **Analyst project:** a readable report of the NBA shot probability assignment, including the data split, baseline comparison, validation, calibration, limitations, and steps to reproduce the submitted code. The assignment repository and its required submission files are separate.
2. **Courtside:** an independent basketball simulator with player searches, shot locations, hot zones, a defender distance scenario slider, timed shooting challenges, replay, and session downloads. [Simulator setup and methods](courtside/README.md).

The simulator uses an external, bundled NBA statistics snapshot. It is a personal extension and **is not part of the assignment submission**. Its make chances are heuristic estimates, not official matchup percentages or the assignment's CatBoost predictions. The site labels recorded shooting data separately from modeled and game adjusted values.

## Try the site

- Choose an offensive player and defender, then select a location on the court.
- Change pressure or drag the defender distance slider to explore the model's assumptions.
- Take a quick shot or hold and release near the green timing band.
- Compare hot zones and challenge results. Export your own session history as CSV.
- Open **Analyst project** to review the separate assignment report and its limitations.

The app runs entirely in the browser. Personal bests stay in this browser's local storage; there is no account or server side leaderboard. WebGL powers the 3D court; a 2D court preview and the shot controls remain available when WebGL is unsupported. VR requires compatible WebXR hardware and remains unverified on physical headsets.

## Run locally

```sh
cd courtside
python serve.py
```

Open <http://127.0.0.1:8767/> for the standalone simulator, or serve the repository root over HTTP to view the combined page. Browser modules and JSON loading require HTTP rather than opening the HTML file directly.

```sh
cd courtside
npm test
node gameplay-tests.mjs
```

The first command checks record totals, model boundaries, and hot zones; the second checks gameplay timing and challenge endings. No npm installation is required for these tests.

## Data and development notes

The included 2025–26 snapshot was retrieved September 20, 2026 from [fuku8/nba-data](https://github.com/fuku8/nba-data). The [source manifest](courtside/source_manifest.json) records its files and checksums. The simulator's calculations and their limitations are documented in the on-page **Data & method** section and the [Courtside README](courtside/README.md).

Freddy Lynch directed the project and selected the features. Codex assisted with implementation and review. The analytical results and simulator should be explained according to their actual methods and limits.
