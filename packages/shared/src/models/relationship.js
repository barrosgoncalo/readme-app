/**
 * Factory for one-directional relationship models stored in top-level collections
 * with deterministic composite IDs (e.g. blocks, friends).
 *
 * Using composite IDs lets you check "did A relate to B?" with a direct O(1)
 * document read instead of a query.
 *
 * @param {string} fromField  name of the "from" UID field (e.g. 'blockerUid')
 * @param {string} toField    name of the "to" UID field   (e.g. 'blockedUid')
 */
export function createRelationshipModel(fromField, toField) {
    return {
        getId: (a, b) => `${a}_${b}`,
        create: (a, b) => ({
            [fromField]: a,
            [toField]: b,
            createdAt: new Date().toISOString(),
        }),
    };
}
