import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import UploadSchema from "./pages/UploadSchema";
import SchemaResult from "./pages/SchemaResult";
import "../src/assets/style/main.css";
import Cursor from "./components/Cursor";
import Login from "./components/Login";
import Register from "./components/Register";
import Features from "./components/Features";
import Demo from "./components/Demo";
import PreLoader from "./components/PreLoader";
import { AnimatePresence } from "framer-motion";

function App() {
  const [loading, setLoading] = useState(true);
  
  // Set body overflow hidden during loading to prevent scrolling
  useEffect(() => {
    if (loading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [loading]);

  return (
    <html lang="en" className="antialiased">
      <body className="bg">
        <AnimatePresence mode="wait">
          {loading && <PreLoader setLoading={setLoading} />}
        </AnimatePresence>
        
        <Cursor />
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/upload" element={<UploadSchema />} />
            <Route path="/result/:id" element={<SchemaResult />} />
            <Route path="/demo" element={<Demo />} />
          </Routes>
        </Router>
      </body>
    </html>
  );
}

export default App;