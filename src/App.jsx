import { useState, useEffect } from 'react';
import WalletCard from './components/walletCard';
import { useWallet, ConnectModal } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';
import Toast from './components/toast';
import Logo from './assets/image.png';
import './App.css';

function App() {
  const { connected, account, disconnect } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [hasConnected, setHasConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [count, setCount] = useState(0);
  const [openWalletId, setOpenWalletId] = useState(null);

  const generateFakeAddress = () => {
    const chars = 'abcdef0123456789';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    return address;
  };

  const [wallets, setWallets] = useState([
    { id: 1, name: "Wallet A", address: generateFakeAddress(), count: 0 },
    { id: 2, name: "Wallet B", address: generateFakeAddress(), count: 0 },
    { id: 3, name: "Wallet C", address: generateFakeAddress(), count: 0 },
    { id: 4, name: "Wallet D", address: generateFakeAddress(), count: 0 },
    { id: 5, name: "Wallet E", address: generateFakeAddress(), count: 0 },
    { id: 6, name: "Wallet F", address: generateFakeAddress(), count: 0 },
  ]);

  useEffect(() => {
    if (connected && account?.address && !hasConnected) {
      setHasConnected(true);
      setConnecting(false);
      setShowModal(false);
      showToast('Wallet connected!', 'success');
    } else if (!connected && connecting) {
      setConnecting(false);
    }
  }, [connected, account, hasConnected]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleLogout = () => {
    disconnect();
    setHasConnected(false);
    showToast('Wallet disconnected', 'error');
  };

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
    showToast('Wallet deleted', 'error');
  };

  const toggleWallet = (id) => {
    setOpenWalletId(prev => (prev === id ? null : id));
  };

  const createNewWallet = () => {
    if (wallets.length >= 26) {
      showToast('Cannot create more than 26 wallets.', 'error');
      return;
    }

    const newId = Date.now();
    const nextLetter = String.fromCharCode(65 + wallets.length);
    const newWallet = {
      id: newId,
      name: `Wallet ${nextLetter}`,
      address: generateFakeAddress(),
      count: 0
    };

    setWallets([...wallets, newWallet]);
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

          {!connected ? (
            <button
              className="connect-wallet"
              onClick={() => {
                setConnecting(true);
                setShowModal(true);
              }}
            >
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="wallet-actions">
              <button className="wallet-address">
                {account?.address.slice(0, 6)}...{account?.address.slice(-4)}
              </button>
              <button className="logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </header>

        <ConnectModal
  open={showModal}
  onOpenChange={(isOpen) => {
    if (!connected) setShowModal(isOpen);
  }}
/>


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
                  address={wallet.address.slice(0, 6) + '....'}
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

            {toast.show && (
              <div className={`toast ${toast.type}`}>
                <Toast
                  message={toast.message}
                  type={toast.type}
                  onClose={() =>
                    setToast({ show: false, message: '', type: '' })
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default App;
