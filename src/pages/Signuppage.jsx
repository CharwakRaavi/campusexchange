import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Signuppage.css';

const Signuppage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [branch, setBranch] = useState("");
    const [year, setYear] = useState("");
    const [role, setRole] = useState("user");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Validate email domain
        if (!email.endsWith('@srkrec.ac.in')) {
            setError("Please use your SRKR Engineering College email address (@srkrec.ac.in)");
            setLoading(false);
            return;
        }

        const allowedBranches = [
            "cse", "ece", "it", "aiml", "aids", "cic", "csd", "csit", "mech", "civil", "eee"
        ];
    
        // Validate branch input
        if (!allowedBranches.includes(branch.toLowerCase())) {
            setError("Invalid branch. Please enter a valid branch.");
            setLoading(false);
            return;
        }

        const newUser = { username, password, email, branch, year, role };

        try {
            console.log('Sending signup request:', { ...newUser, password: '***' });
            
            const response = await fetch('/api/users/signup', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(newUser),
                mode: 'cors'
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Signup response:', data);

            if (response.ok && data.success) {
                console.log('Signup successful');
                alert('Signup successful!');
                navigate('/login');
            } else {
                setError(data.message || 'Signup failed. Please try again.');
            }
        } catch (error) {
            console.error('Error during signup:', error);
            if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
                setError('Unable to connect to the server. Please make sure the server is running.');
            } else {
                setError('An error occurred. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="App">
            <div className="container">
                <div className="logo-container">
                    <div className="logo-icon">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="white"
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                            />
                        </svg>
                    </div>
                </div>

                <h1 className="welcome-title">Create Account</h1>
                <h2 className="welcome-subtitle">Join Campus Exchange today</h2>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="form-group">
                        <label htmlFor="username" className="form-label">Username</label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            className="form-control"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            className="form-control"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength="6"
                            placeholder="Enter your password"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            className="form-control"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your SRKR email (@srkrec.ac.in)"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="branch" className="form-label">Branch</label>
                            <input
                                type="text"
                                name="branch"
                                id="branch"
                                className="form-control"
                                required
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                placeholder="Enter your branch"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="year" className="form-label">Year</label>
                            <select
                                name="year"
                                id="year"
                                className="form-control"
                                value={year}
                                required
                                onChange={(e) => setYear(e.target.value)}
                            >
                                <option value="" disabled>Select Year</option>
                                <option value="1/4">1/4</option>
                                <option value="2/4">2/4</option>
                                <option value="3/4">3/4</option>
                                <option value="4/4">4/4</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="role" className="form-label">Role</label>
                        <select
                            name="role"
                            id="role"
                            className="form-control"
                            value={role}
                            required
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary btn-block"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Signing up...
                            </>
                        ) : (
                            'Create Account'
                        )}
                    </button>

                    <p className="login-link">
                        Already have an account? <Link to="/login">Sign In</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Signuppage;
