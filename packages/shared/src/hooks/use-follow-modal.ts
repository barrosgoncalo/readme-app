import { useState } from 'react';
import { UsersService } from '../services/users';

export function useFollowModal(currentUserUid) {
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalUsers, setModalUsers] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    const openFollowModal = async (type) => {
        if (!currentUserUid) return;

        const isFollowers = type === 'followers';
        setModalTitle(isFollowers ? 'Followers' : 'Following');
        setModalVisible(true);
        setModalLoading(true);
        setModalUsers([]);

        try {
            const users = isFollowers
                ? await UsersService.getFollowers(currentUserUid)
                : await UsersService.getFollowing(currentUserUid);
            setModalUsers(users.map(u => ({ ...u, uid: u.id })));
        } catch (error) {
            console.error('Error opening profile connection modal:', error);
        } finally {
            setModalLoading(false);
        }
    };

    return {
        modalVisible, modalTitle, modalUsers, modalLoading,
        openFollowModal, closeFollowModal: () => setModalVisible(false),
    };
}
