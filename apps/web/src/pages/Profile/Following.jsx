import { getFollowing, toggleFollowUser } from '@readme/shared/src/services/users';
import UserListPage from '../../components/UserListPage.jsx';

export default function Following() {
    return (
        <UserListPage
            title="Following"
            singularCount="PERSON"
            pluralCount="PEOPLE"
            emptyText="You aren't following anyone yet."
            metaDescription={<>You are following these users to stay updated on their books and activity.</>}
            loadUsers={getFollowing}
            actionLabel="Unfollow"
            onAction={(myUid, targetUid) => toggleFollowUser(targetUid, false)}
            actionToast={(name) => `You have successfully unfollowed ${name}.`}
        />
    );
}
