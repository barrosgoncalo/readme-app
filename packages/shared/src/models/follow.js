// @readme/shared/src/models/follow.js

/**
 * Builds the deterministic document ID for a follow relationship.
 * Using a composite ID (instead of an auto-generated one) lets you
 * check "does A follow B?" with a direct O(1)
 * document read instead of a query.
 */
export const getFollowId = (followerUid, followingUid) => {
    return `${followerUid}_${followingUid}`;
};

/**
 * Creates a follow relationship document.
 * Lives in the top-level `follows` collection, doc ID = getFollowId(followerUid, followingUid).
 */
export const createFollow = (followerUid, followingUid) => {
    return {
        followerUid,
        followingUid,
        createdAt: new Date().toISOString(),
    };
};
