// src/components/Footer.jsx
import React from 'react'

const Footer = () => {
    return (
        <footer className="bg-surface text-titanite-light p-4 mt-auto">
            <div className="container mx-auto text-center">
                © {new Date().getFullYear()} Warehouse Schema Generator
            </div>
        </footer>
    )
}

export default Footer
