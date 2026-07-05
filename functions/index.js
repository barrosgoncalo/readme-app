const { setGlobalOptions } = require("firebase-functions");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { algoliasearch } = require("algoliasearch");

setGlobalOptions({ maxInstances: 10 });

const ALGOLIA_APP_ID = "RHUIQIPTCY";
const ALGOLIA_ADMIN_KEY = "e8307a98c93b8ca65d21e1ba2faa1e55"; 
const ALGOLIA_INDEX_NAME = "users";

// Inicialização direta do cliente v5 (sem initIndex)
const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);

// Função Gen 2 imune ao bug de região
exports.syncUserToAlgolia = onDocumentWritten({ document: "users/{userId}", region: "europe-west1" }, async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const data = snapshot.after.data();
    const objectID = event.params.userId;

    try {
        // Se o documento foi apagado no Firestore, apaga no Algolia
        if (!data) {
            await client.deleteObject({
                indexName: ALGOLIA_INDEX_NAME,
                objectID: objectID
            });
            console.log(`Utilizador ${objectID} apagado do Algolia`);
            return;
        }

        // Se foi criado ou atualizado, guarda no Algolia
        await client.saveObject({
            indexName: ALGOLIA_INDEX_NAME,
            body: {
                objectID, 
                ...data
            }
        });
        console.log(`Utilizador ${objectID} sincronizado com sucesso!`);
    } catch (error) {
        console.error("Erro a sincronizar com Algolia:", error);
    }
});
