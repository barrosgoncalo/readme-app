import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@readme/shared/src/contexts/AuthContext/web';

export default function RequireAuth({ children }) {
    const { userLoggedIn, loading } = useAuth();
    const location = useLocation();

    if (loading) return null;
    if (!userLoggedIn) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
    return children;
}
