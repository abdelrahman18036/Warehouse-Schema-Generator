import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import UploadSchema from './pages/UploadSchema'
import SchemaResult from './pages/SchemaResult'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<UploadSchema />} />
        <Route path="/result/:id" element={<SchemaResult />} />
      </Routes>
    </Router>
  )
}

export default App