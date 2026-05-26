import './BoardCell.css'

export default function BoardCell({ value, onCellClick }) {
  return (
    <button type="button" className="board-cell" onClick={onCellClick}>
      {value && (
        <span className={`board-cell__mark board-cell__mark--${value.toLowerCase()}`}>
          {value}
        </span>
      )}
    </button>
  )
}
