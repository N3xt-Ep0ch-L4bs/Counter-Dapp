import React, { useState } from "react";
import { useWallet, ConnectModal } from "@suiet/wallet-kit";
import { useNavigate } from "react-router-dom";
import "@suiet/wallet-kit/style.css";
import "./style.css";
import Logo from "../assets/image.png";
import backArrow from "../assets/back.png";

function History({ history }) {
  const { connected, account } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate(); // <-- navigation hook

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.action
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesFilter = filter === "All" || item.action === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <header className="history-topbar">
        <div className="logo-title">
          <img src={Logo} alt="logo" className="logo" />
          <span className="app-name">QUANTARA</span>
        </div>

        <div className="wallet-info">
          {!connected ? (
            <button
              className="wallet-address-btn"
              onClick={() => setShowModal(true)}
            >
              Connect Wallet
            </button>
          ) : (
            <button className="wallet-address-btn">
              {account?.address.slice(0, 6)}...{account?.address.slice(-4)}
            </button>
          )}
        </div>
      </header>

      <div className="history-container">
        <div className="history-header">
          <img
            src={backArrow}
            alt="back"
            className="back-arrow"
            onClick={() => navigate("/")} // <-- Go to main page
          />
          <div>
            <h2>History</h2>
            <p>Track all past counter updates in real time</p>
          </div>
        </div>

        <div className="history-filters">
          <input
            type="text"
            placeholder="Search for projects"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>All</option>
            <option>Created counter</option>
            <option>Increment</option>
            <option>Decrement</option>
            <option>Reset</option>
            <option>Deleted</option>
          </select>
          <select>
            <option>January</option>
            <option>February</option>
            <option>March</option>
            <option>April</option>
            <option>May</option>
            <option>June</option>
            <option>July</option>
            <option>August</option>
            <option>September</option>
            <option>October</option>
            <option>November</option>
            <option>December</option>
          </select>
        </div>

        {/* Scrollable Table */}
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Old value</th>
                <th>New value</th>
                <th>User address</th>
                <th>TX Hash</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    No activity found.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((h, i) => (
                  <tr key={i}>
                    <td>{h.action}</td>
                    <td>{h.oldValue}</td>
                    <td>{h.newValue}</td>
                    <td>{h.userAddress}</td>
                    <td>
                      <a href="#" className="tx-link">
                        {h.txHash}
                      </a>
                    </td>
                    <td>{h.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button>Previous</button>
          <button>Next</button>
        </div>
      </div>

      {/* Wallet connect modal */}
      <ConnectModal
        open={showModal}
        onOpenChange={(isOpen) => setShowModal(isOpen)}
      />
    </>
  );
}

export default History;
