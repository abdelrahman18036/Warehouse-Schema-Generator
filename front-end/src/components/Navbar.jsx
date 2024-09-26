// src/components/Navbar.jsx
import React from 'react'
import { Link } from 'react-router-dom'

const Navbar = () => {
    return (
        <nav className="bg-surface p-4 shadow-lg">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-titanite font-bold text-2xl">Warehouse Schema Generator</Link>
                <div className="flex items-center space-x-4">
                    <Link to="/upload" className="text-titanite-light hover:text-titanite-dark">Upload Schema</Link>
                    <Link to="/result" className="text-titanite-light hover:text-titanite-dark">Schema Result</Link>
                </div>
            </div>
        </nav>
    )
}

export default Navbar
