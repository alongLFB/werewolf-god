# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Werewolf/Mafia game judge assistant** web application built with Next.js to help novice players act as game moderators. The application provides standardized workflow guidance, automatic game state recording, and intelligent reminders to make it easy for anyone to host a werewolf game.

**Key Features:**
- Multiple game modes (9-player standard, 10-player, 12-player with Wolf King/Guard, 12-player with White Wolf King/Knight)
- Role-based night/day phase management with specific action sequences
- Complex shooting mechanics for Hunters and Wolf Kings
- Automatic game state tracking and win condition detection
- Mobile-first design for single-handed operation

## Technology Stack

- **Framework**: Next.js 15.5.0 (App Router)
- **Language**: TypeScript 5.X
- **Styling**: Tailwind CSS
- **State Management**: Zustand or Redux Toolkit
- **Data Persistence**: localStorage + IndexedDB + Supabase
- **UI Components**: shadcn 2.10.0
- **Animations**: Framer Motion 12.23.12

## Key Architecture Concepts

### Game Roles and Camps
- **Werewolf Camp**: Normal Wolves, Wolf King (can shoot when voted out), White Wolf King (can self-destruct)
- **God Camp**: Seer (nightly identity checks), Witch (poison/antidote), Hunter (shoots when killed), Guard (nightly protection), Knight (daytime duel)
- **Villager Camp**: Regular villagers with no special abilities

### Critical Game Mechanics

#### Night Phase Sequence (FIXED ORDER)
1. **Guard Phase**: Protect a player (cannot protect same player twice in a row)
2. **Werewolf Phase**: Wolves collectively choose kill target
3. **Seer Phase**: Check one player's identity (good/werewolf)
4. **Witch Phase**: Use antidote/poison (first night cannot self-save)
5. **Hunter Status Phase**: System tells hunter if they can shoot (cannot if being poisoned)

#### Shooting Mechanics (Complex Logic)
- **Hunter**: Can shoot when killed by wolves, voted out, brought down by White Wolf King, or dueled by Knight. CANNOT shoot if poisoned by Witch
- **Wolf King**: Can ONLY shoot when voted out, not when killed by other means
- **Shooting Status**: Hunter must be told each night whether they can shoot (based on Witch's poison usage)

#### Special Rules
- "Same Guard Same Save" rule: If Guard protects and Witch saves same player, that player dies
- White Wolf King self-destruct: Can explode during day phase speech, bringing someone down immediately
- Knight duel: One-time ability to duel a player (Knight dies if target is good, target dies if werewolf)

### Data Structure Priorities

**Game State Tracking:**
```typescript
interface Player {
  seatNumber: number
  role: Role
  isAlive: boolean
  deathReason?: 'knife' | 'poison' | 'vote' | 'shoot' | 'duel' | 'bomb'
  canShoot?: boolean // Critical for Hunter/Wolf King
  hasShot?: boolean
  hasUsedAbility?: { poison?: boolean, antidote?: boolean, duel?: boolean }
}

interface ActionRecord {
  round: number
  phase: 'night' | 'day'
  action: 'guard' | 'kill' | 'check' | 'poison' | 'antidote' | 'shoot' | 'bomb' | 'duel' | 'hunterStatus'
  target?: number
  result?: any
}
```

### UI/UX Requirements

**Mobile-First Design:**
- Single-handed operation priority
- Clear phase indicators and action prompts
- Player grid layout with status visualization
- Confirmation dialogs for all critical actions
- Real-time state updates with animations

**Error Prevention:**
- Disable invalid targets (dead players, rule violations)
- Visual feedback for all game state changes
- History tracking with undo capability
- Rule conflict detection and warnings

## Development Commands

Since this project is not yet initialized, future developers should:

1. **Initialize Next.js project**: `npx create-next-app@latest werewolf-judge --typescript --tailwind --app`
2. **Install dependencies**: `npm install zustand framer-motion @radix-ui/react-*` (for shadcn components)
3. **Setup shadcn**: `npx shadcn@latest init`
4. **Development server**: `npm run dev`
5. **Build**: `npm run build`
6. **Type checking**: `npm run type-check` (to be added)
7. **Linting**: `npm run lint`

## Implementation Phases

**Phase 1 (MVP)**: 9-player standard game with basic night/day cycles
**Phase 2**: All game modes, special roles, shooting mechanics
**Phase 3**: Advanced features (TTS, game reports, sharing)
**Phase 4**: Optimization and community features

## Critical Implementation Notes

1. **Shooting Logic**: The Hunter status notification system is complex - must track Witch poison usage and notify Hunter of shooting ability each night
2. **Rule Validation**: Implement strict rule checking (Guard protection limits, Witch first-night restrictions, etc.)
3. **Phase Management**: Night phase has strict ordering that cannot be changed
4. **Win Conditions**: Werewolves win by eliminating all Gods or all Villagers; Good camp wins by eliminating all Werewolves
5. **Data Persistence**: Game state must survive browser refreshes and allow game resumption

## Testing Focus Areas

- Role ability interactions (especially poison/shooting conflicts)
- Phase transition logic
- Win condition detection
- Mobile responsiveness
- Game state persistence and recovery