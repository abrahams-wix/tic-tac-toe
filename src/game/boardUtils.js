export function makeMove(board, index, mark) {
  const next = [...board]
  next[index] = mark
  return next
}

export function getLegalMoves(board) {
  const moves = []
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) moves.push(i)
  }
  return moves
}

export function calculateWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]

  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a]
    }
  }
  return null
}

export function isBoardFull(board) {
  return board.every((cell) => cell != null)
}

export function getOutcome(board) {
  const winner = calculateWinner(board)
  if (winner) return { status: 'win', winner }
  if (isBoardFull(board)) return { status: 'tie' }
  return { status: 'play' }
}

export function canPlayAt(board, index) {
  if (board[index] != null) return false
  return getOutcome(board).status === 'play'
}

export function markForTurn(turn) {
  return turn === 0 ? 'X' : 'O'
}

export function nextTurn(turn) {
  return turn === 0 ? 1 : 0
}

