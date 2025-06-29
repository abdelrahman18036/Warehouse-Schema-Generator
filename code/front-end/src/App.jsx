import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import UploadSchema from "./pages/UploadSchema";
import SchemaResult from "./pages/SchemaResult";
import Dashboard from "./pages/Dashboard";
import AllSchemas from "./pages/AllSchemas";
import "../src/assets/style/main.css";
import Cursor from "./components/Cursor";
import Login from "./components/Login";
import Register from "./components/Register";
import Features from "./components/Features";
import PreLoader from "./components/PreLoader";
import ProtectedRoute from "./components/ProtectedRoute";
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

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute>
                <UploadSchema />
              </ProtectedRoute>
            } />
            <Route path="/result/:id" element={
              <ProtectedRoute>
                <SchemaResult />
              </ProtectedRoute>
            } />
            <Route path="/all-schemas" element={
              <ProtectedRoute>
                <AllSchemas />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </body>
    </html>
  );
}

export default App;