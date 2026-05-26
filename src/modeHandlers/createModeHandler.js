import { GAME_MODES } from '../constants/gameModes.js'
import { LocalModeHandler } from './LocalModeHandler.js'
import { CpuModeHandler } from './CpuModeHandler.js'
import { MultiplayerModeHandler } from './MultiplayerModeHandler.js'

export function createModeHandler(mode) {
  switch (mode) {
    case GAME_MODES.LOCAL:
      return new LocalModeHandler()
    case GAME_MODES.CPU:
      return new CpuModeHandler()
    case GAME_MODES.MULTIPLAYER:
      return new MultiplayerModeHandler()
    default:
      return new LocalModeHandler()
  }
}
