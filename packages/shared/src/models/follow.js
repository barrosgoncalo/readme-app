/**
 * Builds the deterministic document ID for a follow relationship,
 * and reused as-is for follow *requests* (different collection, same ID shape).
 */
export const getFollowId = (followerUid, followingUid) => {
    if (!followerUid || !followingUid) {
        throw new Error('getFollowId requires both followerUid and followingUid.');
    }
    return `${followerUid}_${followingUid}`;
};

/**
 * Creates a follow relationship document (accepted, active follow).
 * Lives in the top-level `follows` collection, doc ID = getFollowId(followerUid, followingUid).
 * Throws on self-follow so this invariant holds no matter which call site constructs it.
 */
export const createFollow = (followerUid, followingUid) => {
    if (!followerUid || !followingUid) {
        throw new Error('createFollow requires both followerUid and followingUid.');
    }
    if (followerUid === followingUid) {
        throw new Error('Cannot create a follow relationship with yourself.');
    }
    return {
        followerUid,
        followingUid,
    };
};

/**
 * Creates a pending follow request document.
 * Lives in the top-level `followRequests` collection, doc ID = getFollowId(requesterUid, targetUid).
 * Deleted on accept (a `follows` doc is created instead) or on decline.
 * Throws on self-request for the same reason as createFollow.
 */
export const createFollowRequest = (requesterUid, targetUid) => {
    if (!requesterUid || !targetUid) {
        throw new Error('createFollowRequest requires both requesterUid and targetUid.');
    }
    if (requesterUid === targetUid) {
        throw new Error('Cannot send a follow request to yourself.');
    }
    return {
        requesterUid,
        targetUid,
    };
};
