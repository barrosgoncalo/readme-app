import { createRelationshipModel } from './relationship';

const { getId, create } = createRelationshipModel('userUid', 'friendUid');

export const getFriendId = getId;
export const createFriend = create;
