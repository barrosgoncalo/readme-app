// @readme/shared/src/models/block.js

/**
 * Builds the deterministic document ID for a block relationship.
 * Using a composite ID (instead of an auto-generated one) lets you
 * check "did A block B?" and "did B block A?" with a direct O(1)
 * document read instead of a query.
 */
export const getBlockId = (blockerUid, blockedUid) => {
    return `${blockerUid}_${blockedUid}`;
};

/**
 * Creates a block relationship document.
 * Lives in the top-level `blocks` collection, doc ID = getBlockId(blockerUid, blockedUid).
 */
export const createBlock = (blockerUid, blockedUid) => {
    return {
        blockerUid: blockerUid,

        blockedUid: blockedUid,

        createdAt: new Date().toISOString()
    };
};
