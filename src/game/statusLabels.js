import { markForTurn } from './boardUtils.js'

export function statusLabel({ status, winner, turn }) {
  if (status === 'win') return `${winner} Wins!`
  if (status === 'tie') return 'Tie!'
  const mark = typeof turn === 'number' ? markForTurn(turn) : turn
  return `${mark}'s Turn`
}
