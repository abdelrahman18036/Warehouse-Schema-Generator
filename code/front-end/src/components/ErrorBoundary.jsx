// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render shows the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can log the error to an error reporting service
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <h2 className="text-2xl font-bold text-red-500">Something went wrong.</h2>
                    <pre className="mt-2 text-white">{this.state.error && this.state.error.toString()}</pre>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
