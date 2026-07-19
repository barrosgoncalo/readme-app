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

    const results = await Promise.all(
        blocks.map(async (blockData) => {
            const blockedUid = blockData.blockedUid;

            let userData = null;
            try {
                userData = await DB.get("users", blockedUid);
            } catch (error) {
                console.error(`Failed to fetch profile for blocked user ${blockedUid}:`, error);
            }

            const exists = userData && !(Array.isArray(userData) && userData.length === 0);
            if (!exists) return null;

            return {
                id: blockedUid,
                username: userData.username ?? blockData.blockedUsername ?? null,
                fullName: userData.fullName ?? blockData.blockedFullName ?? null,
                avatarUrl: userData.photoURL ?? blockData.blockedAvatarUrl ?? null,
            };
        })
    );

    return results.filter(Boolean);
};

/**
 * Fetches the list of UIDs blocked by the current user
 * @param {string} currentUserId - The UID of the currently logged-in user
 */
export async function doGetBlockedUids(currentUserId) {
    if (!currentUserId) return [];

    try {
        const blocks = await DB.get('blocks', [
            { field: 'blockerUid', operator: '==', value: currentUserId }
        ]);

        const uids = blocks.map(block => block.blockedUid).filter(Boolean);

        const existing = await Promise.all(
            uids.map(async (uid) => {
                try {
                    const userData = await DB.get('users', uid);
                    const exists = userData && !(Array.isArray(userData) && userData.length === 0);
                    return exists ? uid : null;
                } catch {
                    return null;
                }
            })
        );

        return existing.filter(Boolean);
    } catch (error) {
        console.error("Error fetching blocked UIDs:", error);
        return [];
    }
}
