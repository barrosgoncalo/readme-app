import { doGetFriends, doRemoveFriend } from '@readme/shared/src/services/friendUser';
import UserListPage from '../../components/UserListPage.jsx';

export default function Friends() {
    return (
        <UserListPage
            title="Friends"
            singularCount="FRIEND"
            pluralCount="FRIENDS"
            emptyText="You haven't added any friends yet."
            loadUsers={doGetFriends}
            actionLabel="Remove"
            onAction={doRemoveFriend}
            actionToast={(name) => `Removed ${name} from friends.`}
            rowClickable
        />
    );
}
