import { createRelationshipModel } from './relationship';

const { getId, create } = createRelationshipModel('blockerUid', 'blockedUid');

export const getBlockId = getId;
export const createBlock = create;
