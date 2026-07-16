import { createContext, useContext, useState } from 'react';
import SearchUsersModal from '../components/quick-actions/SearchUsersModal.jsx';
import BanUserModal from '../components/quick-actions/BanUserModal.jsx';
import BannedUsersModal from '../components/quick-actions/BannedUsersModal.jsx';
import ReportReasonsModal from '../components/quick-actions/ReportReasonsModal.jsx';

const QuickActionsContext = createContext(null);

const MODALS = {
    searchUsers: SearchUsersModal,
    banUser: BanUserModal,
    bannedUsers: BannedUsersModal,
    reportReasons: ReportReasonsModal,
};

export function QuickActionsProvider({ children }) {
    const [activeAction, setActiveAction] = useState(null);
    const openAction = (name) => setActiveAction(name);
    const closeAction = () => setActiveAction(null);

    const Modal = activeAction ? MODALS[activeAction] : null;

    return (
        <QuickActionsContext.Provider value={{ openAction, closeAction }}>
            {children}
            {Modal && <Modal onClose={closeAction} />}
        </QuickActionsContext.Provider>
    );
}

export const useQuickActions = () => useContext(QuickActionsContext);
