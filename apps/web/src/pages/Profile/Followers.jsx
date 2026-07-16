import { UsersService } from '@readme/shared/src/services/users';
import UserListPage from '../../components/UserListPage.jsx';

export default function Followers() {
    return (
        <UserListPage
            title="Followers"
            singularCount="PERSON"
            pluralCount="PEOPLE"
            emptyText="You don't have any followers yet."
            metaDescription={<>These users are following you to stay updated on your books and activity.</>}
            loadUsers={UsersService.getFollowers}
            rowClickable
        />
    );
}
