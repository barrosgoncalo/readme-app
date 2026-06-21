// @readme/shared/src/models/friend.js
// One-way "friend" / follow relationship. Deterministic composite ID lets you
// check "is A friends with B?" with a direct O(1) document read.

export const getFriendId = (userUid, friendUid) => {
    return `${userUid}_${friendUid}`;
};

export const createFriend = (userUid, friendUid) => {
    return {
        userUid,
        friendUid,
        createdAt: new Date().toISOString(),
    };
};
