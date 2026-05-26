/** @typedef {'local' | 'cpu' | 'multiplayer'} GameMode */

/** @type {Readonly<Record<'LOCAL' | 'CPU' | 'MULTIPLAYER', GameMode>>} */
export const GAME_MODES = Object.freeze({
  LOCAL: 'local',
  CPU: 'cpu',
  MULTIPLAYER: 'multiplayer',
})

/** @type {ReadonlyArray<{ mode: GameMode, label: string }>} */
export const GAME_MODE_OPTIONS = Object.freeze([
  { mode: GAME_MODES.LOCAL, label: 'Local' },
  { mode: GAME_MODES.CPU, label: 'vs CPU' },
  { mode: GAME_MODES.MULTIPLAYER, label: 'Online' },
])
