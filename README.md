# Nuxt CI starter

A tiny Nuxt app for testing the team's GitHub PR and CI workflow.

## Requirements

- Node.js 24
- npm

## First-time setup

```bash
npm install
npm test
npm run build
npm run dev
```

Open the local URL printed by Nuxt.

`npm install` creates `package-lock.json`. Commit that file; GitHub Actions uses `npm ci` to install the exact locked dependency tree.

