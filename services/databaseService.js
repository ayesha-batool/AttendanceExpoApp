import { databases } from './appwrite';

const databaseService = {
    async ListDoc(dbId, colIdnote) {
        try {
            const response = await databases.listDocuments(dbId, colIdnote);
            return response.documents || [];
        }
        catch (error) {
            console.error('Error listing documents:', error);
            throw error;
        }
    },

    async createDocument(dbId, collectionId, data) {
        try {
            const response = await databases.createDocument(dbId, collectionId, 'unique()', data);
            return response;
        } catch (error) {
            console.error('Error creating document:', error);
            throw error;
        }
    },

    async updateDocument(dbId, collectionId, documentId, data) {
        try {
            const response = await databases.updateDocument(dbId, collectionId, documentId, data);
            return response;
        } catch (error) {
            console.error('Error updating document:', error);
            throw error;
        }
    },

    async deleteDocument(dbId, collectionId, documentId) {
        try {
            const response = await databases.deleteDocument(dbId, collectionId, documentId);
            return response;
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }
}

export default databaseService;