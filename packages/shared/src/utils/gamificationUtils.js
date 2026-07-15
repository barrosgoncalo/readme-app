import { GAMIFICATION_RANKS } from '@readme/shared/src/constants/gamification';

/**
 * Returns the highest badge a user has unlocked based on completed swaps,
 * or null if they haven't reached the first milestone yet.
 */
export const getHighestUnlockedBadge = (swapsCompleted = 0) => {
    return [...GAMIFICATION_RANKS].reverse().find(b => swapsCompleted >= b.milestone) || null;
};
