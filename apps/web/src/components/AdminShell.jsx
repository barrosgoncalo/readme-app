import { Outlet } from 'react-router-dom';
import AdminSidebar from './admin/AdminSideBar.jsx';
import AdminTopbar from './admin/AdminTopBar.jsx';
import styles from './AdminShell.module.css';

export default function AdminShell() {
    return (
        <div className={styles.shell}>
            <AdminSidebar />
            <div className={styles.main}>
                <AdminTopbar />
                <div className={styles.content}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
