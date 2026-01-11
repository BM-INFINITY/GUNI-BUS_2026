import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [enrollmentNumber, setEnrollmentNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(enrollmentNumber, password);

        if (result.success) {
            // Use redirectTo from backend
            navigate(result.redirectTo || '/');
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1>🚌 University Bus System</h1>
                <h2>Student Login</h2>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                    Login with your enrollment number and password
                </p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Enrollment Number</label>
                        <input
                            type="text"
                            value={enrollmentNumber}
                            onChange={(e) => setEnrollmentNumber(e.target.value)}
                            required
                            placeholder="Enter your enrollment number"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="primary-btn">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666' }}>
                    ℹ️ First time? You'll be redirected to complete your profile
                </p>
            </div>
        </div>
    );
}
