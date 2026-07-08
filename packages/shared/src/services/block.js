// @readme/shared/src/services/block.js
import { getBlockId, createBlock } from "../models/block";
import { DB } from "./DB"; 

export const doBlockUser = async (blockerUid, blockedUid) => {
    await DB.create("blocks", createBlock(blockerUid, blockedUid), getBlockId(blockerUid, blockedUid));
};

export const doUnblockUser = async (blockerUid, blockedUid) => {
    await DB.remove("blocks", getBlockId(blockerUid, blockedUid));
};

export const doIsBlocked = async (uidA, uidB) => {
    const [aBlockedB, bBlockedA] = await Promise.all([
        DB.get("blocks", getBlockId(uidA, uidB)),
        DB.get("blocks", getBlockId(uidB, uidA)),
    ]);
    return !!aBlockedB || !!bBlockedA;
};

export const doGetBlockedUsers = async (blockerUid) => {
    const blocks = await DB.get("blocks", [
        { field: "blockerUid", operator: "==", value: blockerUid }
    ]);

    return await Promise.all(
        blocks.map(async (blockData) => {
            const blockedUid = blockData.blockedUid;
            let username = blockData.blockedUsername ?? null;
            let fullName = blockData.blockedFullName ?? null;
            let avatarUrl = blockData.blockedAvatarUrl ?? null;

            try {
                const userData = await DB.get("users", blockedUid);
                if (userData) {
                    username = userData.username ?? username;
                    fullName = userData.fullName ?? fullName;
                    avatarUrl = userData.photoURL ?? avatarUrl;
                }
            } catch (error) {
                console.error(`Failed to fetch profile for blocked user ${blockedUid}:`, error);
            }

            return { id: blockedUid, username, fullName, avatarUrl };
        })
    );
};

/**
 * Fetches the list of UIDs blocked by the current user
 * @param {string} currentUserId - The UID of the currently logged-in user
 */
export async function doGetBlockedUids(currentUserId) {
    if (!currentUserId) return [];
    
    try {
        // 1. You must query 'blockerUid' (matching your rules)
        // 2. The value must be the logged-in user's UID to satisfy the security rule constraint
        const blocks = await DB.get('blocks', [
            { field: 'blockerUid', operator: '==', value: currentUserId }
        ]);

        // 3. Extract the 'blockedUid' field from your document structure
        return blocks.map(block => block.blockedUid).filter(Boolean);
    } catch (error) {
        console.error("Error fetching blocked UIDs:", error);
        return [];
    }
}
