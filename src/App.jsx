import { useState, useEffect } from 'react';
import WalletCard from './components/walletCard';
import { useWallet, ConnectModal } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';
import Toast from './components/toast';
import Logo from './assets/image.png';
import './App.css';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const PACKAGE_ID = '0xa81d8c58d56710d463dfbc178e3f433e8293733f466bd04292f7157df697b9b9';
const MODULE_NAME = 'counter';
const GLOBAL_COUNTER_ID = '0xbbcd51e532e9ac71170eda1559ba971942dce742336d7bc7d3ccf6ef1f36213a';
const client = new SuiClient({ url: getFullnodeUrl('testnet') });

function App() {
  const { connected, account, disconnect, signAndExecuteTransaction } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [hasConnected, setHasConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [count, setCount] = useState(0);
  const [openWalletId, setOpenWalletId] = useState(null);
  const [wallets, setWallets] = useState([]);

 useEffect(() => {
  if (connected && account?.address && !hasConnected) {
    setHasConnected(true);
    setConnecting(false);
    setShowModal(false); // ✅ close modal after connect
    showToast('Wallet connected!', 'success');
    refreshGlobalCounter();
  } 
  if (!connected) {
    setHasConnected(false);
    setShowModal(false); // ✅ close modal after logout
  }
}, [connected, account, hasConnected]);


  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  async function sendTx(tx) {
    const res = await signAndExecuteTransaction({ transaction: tx });
    const digest = res?.digest || res?.effects?.transactionDigest;
    if (!digest) return res;
    try {
      const txb = await client.getTransactionBlock({
        digest,
        options: { showObjectChanges: true, showEffects: true, showEvents: true },
      });
      return { ...res, __txb: txb };
    } catch {
      return res;
    }
  }

  async function refreshGlobalCounter() {
    try {
      const obj = await client.getObject({ id: GLOBAL_COUNTER_ID, options: { showContent: true } });
      const fields = obj?.data?.content?.dataType === 'moveObject' ? obj.data.content.fields : null;
      if (fields?.value !== undefined) setCount(Number(fields.value));
    } catch (e) {
      console.error('Failed to fetch GlobalCounter:', e);
    }
  }

  async function createPersonalCounterOnChain() {
    const tx = new Transaction();
    tx.moveCall({ target: `${PACKAGE_ID}::${MODULE_NAME}::create_personal_counter`, arguments: [] });
    await sendTx(tx);

    for (let i = 0; i < 3; i++) {
      const objs = await client.getOwnedObjects({
        owner: account.address,
        filter: { StructType: `${PACKAGE_ID}::${MODULE_NAME}::PersonalCounter` },
        options: { showContent: true }
      });
      if (objs.data.length) return objs.data[0].data.objectId;
      await new Promise(r => setTimeout(r, 1000));
    }
    return null;
  }

  async function incrementGlobal() {
    const tx = new Transaction();
    tx.moveCall({ target: `${PACKAGE_ID}::${MODULE_NAME}::increment_global_counter`, arguments: [tx.object(GLOBAL_COUNTER_ID)] });
    await sendTx(tx);
    await refreshGlobalCounter();
  }

  async function decrementGlobal() {
    const tx = new Transaction();
    tx.moveCall({ target: `${PACKAGE_ID}::${MODULE_NAME}::decrement_global_counter`, arguments: [tx.object(GLOBAL_COUNTER_ID)] });
    await sendTx(tx);
    await refreshGlobalCounter();
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

  const syncWalletCountById = async (id) => {
    const target = wallets.find((w) => w.id === id);
    if (!target?.objectId) return;
    try {
      const obj = await client.getObject({ id: target.objectId, options: { showContent: true } });
      const value = obj?.data?.content?.fields?.value;
      if (value !== undefined) {
        setWallets((prev) => prev.map((w) => w.id === id ? { ...w, count: Number(value) } : w));
      }
    } catch (e) {
      console.error('Failed to fetch personal counter:', e);
    }
  };

  const updateCount = async (id, delta) => {
    const target = wallets.find((w) => w.id === id);
    if (!target) return showToast('Counter not found', 'error');
    if (!target.objectId) return showToast('Create this counter first', 'error');

    try {
      delta > 0 ? await incrementPersonal(target.objectId) : await decrementPersonal(target.objectId);
      await syncWalletCountById(id);
    } catch {
      showToast('Update failed', 'error');
    }
  };

  const resetCount = async (id) => {
    const target = wallets.find((w) => w.id === id);
    if (!target?.objectId) return showToast('Create this counter first', 'error');

    try {
      await resetPersonal(target.objectId);
      await syncWalletCountById(id);
    } catch {
      showToast('Reset failed', 'error');
    }
  };

  const deleteWallet = async (id) => {
    const target = wallets.find((w) => w.id === id);
    if (target?.objectId) await deletePersonal(target.objectId);
    setWallets(wallets.filter((w) => w.id !== id));
    if (openWalletId === id) setOpenWalletId(null);
    showToast('Counter deleted', 'error');
  };

  const createNewWallet = async () => {
    let objectId = await createPersonalCounterOnChain();
    if (!objectId) return showToast('Failed to create counter', 'error');

    const newWallet = {
      id: Date.now(),
      name: `Wallet ${String.fromCharCode(65 + wallets.length)}`,
      address: account.address,
      count: 0,
      objectId
    };
    setWallets([...wallets, newWallet]);
    setShowModal(false);
    showToast('Wallet created successfully!', 'success');
  };

  return (
    <section>
      <div className="app">
        <header>
          <div className="logo-title">
            <img src={Logo} alt="logo" className="logo" />
            <h1>COUNTER</h1>
          </div>
          {!connected ? (
            <button onClick={() => { setConnecting(true); setShowModal(true); }} className="connect-wallet">
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div className="wallet-actions">
              <button className='wallet-address'>{account?.address.slice(0, 6)}...{account?.address.slice(-4)}</button>
              <button onClick={() => { disconnect(); setHasConnected(false); showToast('Wallet disconnected', 'error'); }} className='logout'>Logout</button>
            </div>
          )}
        </header>

       <ConnectModal 
  open={showModal} 
  onOpenChange={setShowModal} 
/>


        <div className="main-content">
          <div className="counter-box">
            <h2>General Counter</h2>
            <div className="btns">
              <div className="count">{count}</div>
              <button onClick={incrementGlobal}>+</button>
              <button onClick={decrementGlobal}>-</button>
            </div>
          </div>

          <div className="wallets-section">
            <div className="wallets-header">
              <button onClick={createNewWallet} className='create-new'>Create new counter +</button>
            </div>
            <div className="wallets">
              {wallets.map((wallet) => (
                <WalletCard
                  key={wallet.id}
                  address={wallet.address.slice(0, 6) + '....'}
                  count={wallet.count}
                  isOpen={openWalletId === wallet.id}
                  onToggle={() => setOpenWalletId(openWalletId === wallet.id ? null : wallet.id)}
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
