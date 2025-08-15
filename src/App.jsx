import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import MainPage from "./MainPage";
import History from "./components/History";

function App() {
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("counterHistory");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("counterHistory", JSON.stringify(history));
  }, [history]);

  const addHistory = (action, oldVal, newVal, userAddress = "0x1234...abcd") => {
    const newEntry = {
      action,
      oldValue: oldVal,
      newValue: newVal,
      userAddress,
      txHash: "0x" + Math.random().toString(16).slice(2, 6) + "...",
      date: new Date().toLocaleDateString()
    };
    setHistory((prev) => [...prev, newEntry]);
  };

  return (
    <Routes>
      <Route path="/" element={<MainPage history={history} addHistory={addHistory} />} />
      <Route path="/history" element={<History history={history} />} />
    </Routes>
  );
}

export default App;
