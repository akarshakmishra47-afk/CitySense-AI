# CitySense AI

## Problem
Cities receive fragmented citizen complaints that are often treated as independent tickets.

## Solution
CitySense connects related complaints to identify emerging civic problems.

## Innovation
Traditional complaint systems count tickets.
CitySense connects them.

## Technology
HTML, CSS, Vanilla JavaScript, Node.js, Express.js, SQLite, Prisma, OpenAI, Leaflet, OpenStreetMap, Chart.js, Zod

## Architecture
Citizen
   â†“
HTML/CSS/JavaScript
   â†“
Express API
   â†“
AI Analysis
   â†“
SQLite + Prisma
   â†“
Clustering Engine
   â†“
Probable Root Cause
   â†“
Priority Engine
   â†“
Admin Dashboard

## Setup
```bash
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

## Demo
1. Open CitySense.
2. Go to Command Center.
3. Click Run AI Demo.
4. Show complaint clustering.
5. Show probable underlying issue.
6. Show priority.
7. Show recommended action.
