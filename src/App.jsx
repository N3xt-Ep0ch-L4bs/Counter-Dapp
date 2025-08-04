import { useState } from 'react';
import Logo from './assets/image.png';
import Toast from './components/toast';
import './App.css';
import WalletCard from './components/walletCard';

function App() {
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const [count, setCount] = useState(0);
  const [wallets, setWallets] = useState([
    { id: 1, name: "Wallet A", count: 0 },
    { id: 2, name: "Wallet B", count: 0 },
    { id: 3, name: "Wallet C", count: 0 },
    { id: 4, name: "Wallet D", count: 0 },
    { id: 5, name: "Wallet E", count: 0 },
    { id: 6, name: "Wallet F", count: 0 },
  ]);
  const [openWalletId, setOpenWalletId] = useState(null);

  const updateCount = (id, delta) => {
    setWallets(prev =>
      prev.map(wallet =>
        wallet.id === id ? { ...wallet, count: wallet.count + delta } : wallet
      )
    );
  };

  const resetCount = (id) => {
    setWallets(prev =>
      prev.map(wallet =>
        wallet.id === id ? { ...wallet, count: 0 } : wallet
      )
    );
  };

  const deleteWallet = (id) => {
    setWallets(prev => prev.filter(wallet => wallet.id !== id));
    if (openWalletId === id) setOpenWalletId(null);
    showToast('🗑️ Wallet deleted', 'error');
  };

  const toggleWallet = (id) => {
    setOpenWalletId(prev => (prev === id ? null : id));
  };

  const createNewWallet = () => {
    if (wallets.length >= 26) {
      showToast(' Cannot create more than 26 wallets.', 'error');
      return;
    }

    const newId = Date.now();
    const nextLetter = String.fromCharCode(65 + wallets.length);
    setWallets([
      ...wallets,
      { id: newId, name: `Wallet ${nextLetter}`, count: 0 }
    ]);
    showToast('Wallet created successfully!', 'success');
  };

  return (
    <section>
      <div className="app">
        <header>
          <div className="logo-title">
            <img src={Logo} alt="logo" className="logo" />
            <h1>QUANTDAPP</h1>
          </div>
          <button className="connect-wallet">Connect Wallet</button>
        </header>

        <div className="main-content">
          <div className="counter-box">
            <h2>General Counter</h2>
            <div className="btns">
              <div className="count">{count}</div>
              <button onClick={() => setCount(count + 1)}>+</button>
              <button onClick={() => setCount(count - 1)}>-</button>
            </div>
          </div>

          <div className="wallets-section">
  <div className="wallets-header">
    <button className="create-new" onClick={createNewWallet}>
      Create new counter +
    </button>
  </div>

  <div className="wallets">
    {wallets.map(wallet => (
      <WalletCard
        key={wallet.id}
        address={wallet.id}
        count={wallet.count}
        isOpen={openWalletId === wallet.id}
        onToggle={() => toggleWallet(wallet.id)}
        onIncrement={() => updateCount(wallet.id, 1)}
        onDecrement={() => updateCount(wallet.id, -1)}
        onReset={() => resetCount(wallet.id)}
        onDelete={() => deleteWallet(wallet.id)}
      />
    ))}
  </div>

  <div className="toast">
    {toast.show && (
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: '' })} />
    )}
  </div>
</div>
        </div>
      </div>
    </section>
  );
}

export default App;
