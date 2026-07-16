import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSideBar.jsx';
import AdminTopbar from './AdminTopBar.jsx';
import { QuickActionsProvider } from '../contexts/QuickActionsContext.jsx';
import styles from './AdminShell.module.css';

export default function AdminShell() {
    return (
        <QuickActionsProvider>
            <div className={styles.shell}>
                <AdminSidebar />
                <div className={styles.main}>
                    <AdminTopbar />
                    <div className={styles.content}>
                        <Outlet />
                    </div>
                </div>
            </div>
        </QuickActionsProvider>
    );
}
