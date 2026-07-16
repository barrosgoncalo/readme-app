import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout.jsx';
import Button from '../components/Button.jsx';

export default function Welcome() {
    return (
        <AuthLayout
            title="Welcome to README"
            subtitle="Trade books, join events, and connect with other readers."
            footer={
                <span>
                    Already have an account? <Link to="/login">Sign in</Link>
                </span>
            }
        >
            <Link to="/register" style={{ width: '100%' }}>
                <Button>Get started</Button>
            </Link>
            <Link to="/login" style={{ width: '100%' }}>
                <Button variant="ghost">I already have an account</Button>
            </Link>
        </AuthLayout>
    );
}
