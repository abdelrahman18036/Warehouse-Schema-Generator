// src/pages/Home.jsx
import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'

const Home = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background text-white">
            <Navbar />
            <main className="flex-grow container mx-auto p-8">
                <h1 className="text-4xl font-bold mb-6 text-titanite">Welcome to Warehouse Schema Generator</h1>
                <p className="text-lg mb-6">Upload your database schema and generate a warehouse schema with AI enhancements.</p>
                <Link to="/upload" className="bg-titanite text-white px-6 py-3 rounded-lg shadow-lg hover:bg-titanite-dark transition">
                    Get Started
                </Link>
            </main>
            <Footer />
        </div>
    )
}

export default Home
