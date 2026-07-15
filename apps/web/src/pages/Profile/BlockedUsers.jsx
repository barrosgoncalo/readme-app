import { doGetBlockedUsers, doUnblockUser } from '@readme/shared/src/services/block';
import UserListPage from '../../components/UserListPage.jsx';

export default function BlockedUsers() {
    return (
        <UserListPage
            title="Blocked Users"
            singularCount="PERSON"
            pluralCount="PEOPLE"
            emptyText="You haven't blocked anyone."
            metaDescription={<>Blocked users cannot see your profile, posts, or contact you.<br />They are not notified when you block them.</>}
            loadUsers={doGetBlockedUsers}
            actionLabel="Unblock"
            onAction={doUnblockUser}
            actionToast={(name) => `You have successfully unblocked ${name}.`}
        />
    );
}
