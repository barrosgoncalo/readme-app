/**
 * Builds the deterministic document ID for a follow relationship,
 * and reused as-is for follow *requests* (different collection, same ID shape).
 */
export const getFollowId = (followerUid, followingUid) => {
    return `${followerUid}_${followingUid}`;
};

/**
 * Creates a follow relationship document (accepted, active follow).
 * Lives in the top-level `follows` collection, doc ID = getFollowId(followerUid, followingUid).
 */
export const createFollow = (followerUid, followingUid) => {
    return {
        followerUid,
        followingUid,
    };
};

/**
 * Creates a pending follow request document.
 * Lives in the top-level `followRequests` collection, doc ID = getFollowId(requesterUid, targetUid).
 * Deleted on accept (a `follows` doc is created instead) or on decline.
 */
export const createFollowRequest = (requesterUid, targetUid) => {
    return {
        requesterUid,
        targetUid,
    };
};
