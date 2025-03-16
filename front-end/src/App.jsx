import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import UploadSchema from "./pages/UploadSchema";
import SchemaResult from "./pages/SchemaResult";
import "../src/assets/style/main.css";
import Cursor from "./components/Cursor";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  return (
    <html lang="en" className=" antialiased">
      <body className="bg">
      <Cursor />
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/upload" element={<UploadSchema />} />
            <Route path="/result/:id" element={<SchemaResult />} />
          </Routes>
        </Router>
      </body>
    </html>
  );
}

export default App;
