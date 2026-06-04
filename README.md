# PredictWC

World Cup prediction app built with React, Vite, Tailwind CSS, and Firestore.

## Features

- Guest mode with no login
- Manual admin management for matches
- JSON import for match fixtures
- Realtime leaderboard
- Prediction scoring with automatic point updates

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill in Firebase values.

3. Run the app:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

## Firestore Collections

- `users`
- `matches`
- `predictions`

## Match Format

```json
{
  "id": "match-001",
  "homeTeam": "Argentina",
  "awayTeam": "France",
  "homeLogo": "",
  "awayLogo": "",
  "matchTime": "2026-06-12T18:00:00Z",
  "status": "upcoming",
  "homeScore": null,
  "awayScore": null,
  "winner": null
}
```

## Admin Flow

- Add a match manually
- Edit a match
- Delete a match
- Import `matches.json`
- Set score and mark the match as `finished`
- The app recalculates prediction points and leaderboard totals automatically
