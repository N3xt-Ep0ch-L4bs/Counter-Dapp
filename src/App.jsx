import { useState, useEffect } from 'react';
import WalletCard from './components/walletCard';
import { useWallet, ConnectModal } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';
import Toast from './components/toast';
import Logo from './assets/image.png';
import './App.css';

// 🔗 Sui SDK imports for on-chain reads & tx building (keeps the same builder style as your template)
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

// ======== CONTRACT CONSTANTS (fill these in) ========
const PACKAGE_ID = '0xa81d8c58d56710d463dfbc178e3f433e8293733f466bd04292f7157df697b9b9';
const MODULE_NAME = 'counter';
// Shared object created in `init()` of your module
const GLOBAL_COUNTER_ID = '0xbbcd51e532e9ac71170eda1559ba971942dce742336d7bc7d3ccf6ef1f36213a';

// Fullnode client (testnet by default; switch to 'mainnet' if needed)
const client = new SuiClient({ url: getFullnodeUrl('testnet') });

function App() {
  const { connected, account, disconnect, signAndExecuteTransaction } = useWallet();

  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [hasConnected, setHasConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // NOTE: `count` reflects on-chain GlobalCounter.value (we sync it after txs)
  const [count, setCount] = useState(0);
  const [openWalletId, setOpenWalletId] = useState(null);

  // Local helper to fake an address label (UI-only) — unchanged
  const generateFakeAddress = () => {
    const chars = 'abcdef0123456789';
    let address = '0x';
    for (let i = 0; i < 40; i++) address += chars[Math.floor(Math.random() * chars.length)];
    return address;
  };

  // Each wallet card now also tracks the on-chain PersonalCounter objectId (invisible to UI)
  const [wallets, setWallets] = useState([
    // { id: 1, name: 'Wallet A', address: generateFakeAddress(), count: 0, objectId: null },
    // { id: 2, name: 'Wallet B', address: generateFakeAddress(), count: 0, objectId: null },
    // { id: 3, name: 'Wallet C', address: generateFakeAddress(), count: 0, objectId: null },
    // { id: 4, name: 'Wallet D', address: generateFakeAddress(), count: 0, objectId: null },
    // { id: 5, name: 'Wallet E', address: generateFakeAddress(), count: 0, objectId: null },
    // { id: 6, name: 'Wallet F', address: generateFakeAddress(), count: 0, objectId: null },
  ]);

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (connected && account?.address && !hasConnected) {
      setHasConnected(true);
      setConnecting(false);
      setShowModal(false);
      showToast('Wallet connected!', 'success');
      // Sync global counter from chain on first connect
      refreshGlobalCounter();
    } else if (!connected && connecting) {
      setConnecting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, account, hasConnected]);

  // ==================== TOAST ====================
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // ==================== CHAIN HELPERS ====================
  async function sendTx(tx) {
    // Uses Suiet's signAndExecuteTransaction with the *Transaction* builder (not TransactionBlock)
    const res = await signAndExecuteTransaction({ transaction: tx });
    const digest = res?.digest || res?.effects?.transactionDigest;
    if (!digest) return res;

    // Pull object changes so we can find created object IDs, etc.
    try {
      const txb = await client.getTransactionBlock({
        digest,
        options: { showObjectChanges: true, showEffects: true, showEvents: true },
      });
      return { ...res, __txb: txb };
    } catch (e) {
      // Non-fatal if RPC cannot fetch details; still return wallet result
      return res;
    }
  }

  async function refreshGlobalCounter() {
    if (!GLOBAL_COUNTER_ID || GLOBAL_COUNTER_ID.startsWith('REPLACE_')) return;
    try {
      const obj = await client.getObject({ id: GLOBAL_COUNTER_ID, options: { showContent: true } });
      const fields = obj?.data?.content?.dataType === 'moveObject' ? obj.data.content.fields : null;
      if (fields && typeof fields.value !== 'undefined') setCount(Number(fields.value));
    } catch (e) {
      console.error('Failed to fetch GlobalCounter:', e);
    }
  }

  async function refreshPersonalCounterValue(objectId) {
    try {
      const obj = await client.getObject({ id: objectId, options: { showContent: true } });
      const fields = obj?.data?.content?.dataType === 'moveObject' ? obj.data.content.fields : null;
      return fields && typeof fields.value !== 'undefined' ? Number(fields.value) : null;
    } catch (e) {
      console.error('Failed to fetch PersonalCounter:', e);
      return null;
    }
  }

  // ==================== MOVE CALLS ====================
  async function incrementGlobal() {
    if (!connected || !account) return showToast('Connect a wallet first', 'error');
    if (!GLOBAL_COUNTER_ID || GLOBAL_COUNTER_ID.startsWith('REPLACE_')) return showToast('Set GLOBAL_COUNTER_ID', 'error');
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::increment_global_counter`,
        arguments: [tx.object(GLOBAL_COUNTER_ID)],
      });
      await sendTx(tx);
      await refreshGlobalCounter();
    } catch (e) {
      console.error(e);
      showToast('Increment failed', 'error');
    }
  }

  async function decrementGlobal() {
    if (!connected || !account) return showToast('Connect a wallet first', 'error');
    if (!GLOBAL_COUNTER_ID || GLOBAL_COUNTER_ID.startsWith('REPLACE_')) return showToast('Set GLOBAL_COUNTER_ID', 'error');
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::${MODULE_NAME}::decrement_global_counter`,
        arguments: [tx.object(GLOBAL_COUNTER_ID)],
      });
      await sendTx(tx);
      await refreshGlobalCounter();
    } catch (e) {
      console.error(e);
      showToast('Decrement failed', 'error');
    }
  }

  async function createPersonalCounterOnChain() {
    if (!connected || !account) throw new Error('Connect a wallet first');
    const tx = new Transaction();
    tx.moveCall({ target: `${PACKAGE_ID}::${MODULE_NAME}::create_personal_counter`, arguments: [] });
    const res = await sendTx(tx);

    // Try to discover the created PersonalCounter object ID from objectChanges
    const created = res?.__txb?.objectChanges?.filter((c) => c.type === 'created') || [];
    const pc = created.find((c) => String(c.objectType || '').includes('PersonalCounter'));
    return pc?.objectId || null;
  }

  async function incrementPersonal(objectId) {
    const tx = new Transaction();
    tx.moveCall({ target: `${PACKAGE_ID}::${MODULE_NAME}::increment_personal_counter`, arguments: [tx.object(objectId)] });
    return await sendTx(tx);
  }

  async function decrementPersonal(objectId) {
    const tx = new Transaction();
    tx.moveCall({ target: `${PACKAGE_ID}::${MODULE_NAME}::decrement_personal_counter`, arguments: [tx.object(objectId)] });
    return await sendTx(tx);
  }

  async function resetPersonal(objectId) {
    const tx = new Transaction();
    tx.moveCall({ target: `${PACKAGE_ID}::${MODULE_NAME}::reset_personal_counter`, arguments: [tx.object(objectId)] });
    return await sendTx(tx);
  }

  async function deletePersonal(objectId) {
    const tx = new Transaction();
    tx.moveCall({ target: `${PACKAGE_ID}::${MODULE_NAME}::delete_personal_counter`, arguments: [tx.object(objectId)] });
    return await sendTx(tx);
  }

  // ==================== EXISTING UI CALLBACKS (wired to chain) ====================
  const handleLogout = () => {
    disconnect();
    setHasConnected(false);
    showToast('Wallet disconnected', 'error');
  };

  // General counter buttons now call on-chain then sync local value
  const handleGlobalPlus = async () => {
    await incrementGlobal();
  };
  const handleGlobalMinus = async () => {
    await decrementGlobal();
  };

  // Update a specific wallet card's count locally after reading from chain
  async function syncWalletCountById(id) {
    const target = wallets.find((w) => w.id === id);
    if (!target?.objectId) return;
    const value = await refreshPersonalCounterValue(target.objectId);
    if (value === null) return;
    setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, count: value } : w)));
  }

  const updateCount = async (id, delta) => {
    const target = wallets.find((w) => w.id === id);
    if (!target) return;
    if (!connected) return showToast('Connect a wallet first', 'error');
    if (!target.objectId) return showToast('Create this counter first', 'error');

    try {
      if (delta > 0) await incrementPersonal(target.objectId);
      else await decrementPersonal(target.objectId);
      await syncWalletCountById(id);
    } catch (e) {
      console.error(e);
      showToast('Update failed', 'error');
    }
  };

  const resetCount = async (id) => {
    const target = wallets.find((w) => w.id === id);
    if (!target) return;
    if (!connected) return showToast('Connect a wallet first', 'error');
    if (!target.objectId) return showToast('Create this counter first', 'error');

    try {
      await resetPersonal(target.objectId);
      await syncWalletCountById(id);
    } catch (e) {
      console.error(e);
      showToast('Reset failed', 'error');
    }
  };

  const deleteWallet = async (id) => {
    const target = wallets.find((w) => w.id === id);
    if (connected && target?.objectId) {
      try {
        await deletePersonal(target.objectId);
      } catch (e) {
        console.warn('On-chain delete failed or skipped:', e);
      }
    }
    setWallets((prev) => prev.filter((w) => w.id !== id));
    if (openWalletId === id) setOpenWalletId(null);
    showToast('Wallet deleted', 'error');
  };

  const toggleWallet = (id) => setOpenWalletId((prev) => (prev === id ? null : id));

  const createNewWallet = async () => {
    if (wallets.length >= 26) return showToast('Cannot create more than 26 wallets.', 'error');
    if (!connected) return showToast('Connect a wallet first', 'error');

    // 1) Create on-chain PersonalCounter
    let objectId = null;
    try {
      objectId = await createPersonalCounterOnChain();
      if (!objectId) return showToast('Failed to create PersonalCounter on-chain', 'error');
    } catch (e) {
      console.error(e);
      return showToast('Failed to create PersonalCounter on-chain', 'error');
    }

    // 2) Create the UI card (unchanged visually)
    const newId = Date.now();
    const nextLetter = String.fromCharCode(65 + wallets.length);
    const newWallet = {
      id: newId,
      name: `Wallet ${nextLetter}`,
      address: generateFakeAddress(), // label only
      count: 0,
      objectId, // ← link the on-chain object to this card
    };

    setWallets([...wallets, newWallet]);
    showToast('Wallet created successfully!', 'success');
  };

  const showToastIfNotConnected = () => {
    if (!connected) showToast('Please connect your wallet', 'error');
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
              <button className="wallet-address" onClick={showToastIfNotConnected}>
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
              {/* Buttons now call on-chain handlers, UI unchanged */}
              <button onClick={handleGlobalPlus}>+</button>
              <button onClick={handleGlobalMinus}>-</button>
            </div>
          </div>

          <div className="wallets-section">
            <div className="wallets-header">
              <button className="create-new" onClick={createNewWallet}>
                Create new counter +
              </button>
            </div>

            <div className="wallets">
              {wallets.map((wallet) => (
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
                <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: '' })} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default App;
