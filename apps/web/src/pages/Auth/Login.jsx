import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(getAuth(), email, password);
            navigate('/admin', { replace: true });
        } catch (err) {
            console.error("Login failed:", err);
            setError("Invalid credentials. Please verify your administrative access.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            display: 'flex', justifyContent: 'center', alignItems: 'center', 
            height: '100vh', backgroundColor: '#121212', fontFamily: 'sans-serif' 
        }}>
            <form onSubmit={handleSubmit} style={{
                width: '100%', maxWidth: '380px', padding: '40px',
                backgroundColor: '#1e1e1e', borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)', color: '#fff'
            }}>
                <h2 style={{ textAlign: 'center', marginBottom: '30px', fontWeight: 'bold' }}>🛡️ Admin Portal</h2>
                
                {error && (
                    <div style={{
                        padding: '12px', backgroundColor: 'rgba(220, 53, 69, 0.15)',
                        border: '1px solid #dc3545', borderRadius: '4px',
                        color: '#f8d7da', fontSize: '14px', marginBottom: '20px', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#aaa' }}>Email Address</label>
                    <input 
                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        style={{ width: '100%', padding: '12px', border: '1px solid #333', borderRadius: '4px', backgroundColor: '#262626', color: '#fff', boxSizing: 'border-box' }}
                    />
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#aaa' }}>Password</label>
                    <input 
                        type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                        style={{ width: '100%', padding: '12px', border: '1px solid #333', borderRadius: '4px', backgroundColor: '#262626', color: '#fff', boxSizing: 'border-box' }}
                    />
                </div>

                <button 
                    type="submit" disabled={loading}
                    style={{ width: '100%', padding: '12px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? 'Authenticating...' : 'Secure Sign In'}
                </button>
            </form>
        </div>
    );
}
