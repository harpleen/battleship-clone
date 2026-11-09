# Battleship

A browser Battleship game with player accounts, three AI difficulties, power-ups and a ranked mode that records every game to the player's profile. A team project at Makers Academy, December 2025 to January 2026.

## Stack

- `frontend/`: React 18 with Vite and React Router; Jest and Vitest for tests.
- `api/`: Node and Express, MongoDB through Mongoose, JWT authentication with bcrypt-hashed passwords; Jest for tests. The `godmode` route uses the OpenAI API for an AI opponent.

## My part (Daniel Pascaru)

I built the player accounts and the ranked mode:

- the `User` model, with wins and losses, shots fired, hits and accuracy, time played, the same statistics per difficulty, and a game history;
- the users API: sign-up with password validation, login issuing a JWT, a token-checked `/me` profile route, an atomic stats update after each game, and account deletion;
- the login and sign-up pages and the front-end auth service, and the ranked-match entry from the home screen.

## Running it

API (needs a MongoDB instance):

```sh
cd api
npm install
cp .env.test .env         # set MONGODB_URL and JWT_SECRET; add OPENAI_API_KEY for godmode
npm run dev               # http://localhost:3000
npm test
```

Front end:

```sh
cd frontend
npm install
npm run dev               # http://localhost:5173
npm test
```
