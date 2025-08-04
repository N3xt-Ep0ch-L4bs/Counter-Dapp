
const CounterCard = ({ id, value, onIncrement, onDecrement, onReset, onDelete }) => {
  return (
    <div className="counter-card">
      <h4>0x{id}...</h4>
      <h2>{value}</h2>
      <div className="button-group">
        <button className="btn green" onClick={onIncrement}>+</button>
        <button className="btn gray" onClick={onDecrement}>-</button>
        <button className="btn red" onClick={onDelete}>🗑</button>
        <button className="btn light" onClick={onReset}></button>
      </div>
    </div>
  );
};

export default CounterCard;
