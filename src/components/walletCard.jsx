import Reset from "../assets/reset.png"
import Delete from "../assets/delete.png"
import ArrowUp from "../assets/arrowup.png"
import ArrowDown from '../assets/arrowdown.png'
import Add from '../assets/add.png'
import Subtract from '../assets/subtract.png'
import './style.css';

const WalletCard = ({ address, isOpen, onToggle,  count,
  onIncrement,
  onDecrement,
  onDelete,
  onReset, }) => {
  return (
    <div className="card-wrapper">
      {!isOpen ? (
        <div className="wallet" onClick={onToggle}>
          {address}
          <span className="arrow">
            <img src={ArrowDown} className="arrow" alt="arrow" />
          </span>
        </div>
      ) : (
        <div className="card-container">
          <p className="id-box">{address}</p>
          <div className="arrow" onClick={onToggle}>
            <img src={ArrowUp} alt="arrow" />
          </div>
          <h3 className="count">{count}</h3>
          <div className="btn-group">
            <button className="add" onClick={onIncrement}><img src={Add} alt="add" className="ic" /></button>
            <button className="subtract" onClick={onDecrement}><img src={Subtract} alt="subtract" /></button>
            <button className="delete"><img className="icon" src={Delete} alt="delete" onClick={onDelete} /></button>
            <button className="reset"><img className="icon" src={Reset} alt="reset" onClick={onReset}/></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletCard;

