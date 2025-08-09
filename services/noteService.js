import { Account, Client, Databases, ID } from "appwrite";
// Environment config
const config = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  project: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DB_ID,
  collectionId: {
    notes: process.env.EXPO_PUBLIC_APPWRITE_COL_NOTES_ID,
  },
  bundleId: process.env.EXPO_PUBLIC_APPWRITE_BUNDLE_ID,
};

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.project);

// Initialize database
const databases = new Databases(client);
const account = new Account(client);

// 🔹 Utility: List all documents
const ListDoc = async (dbId, colIdnote) => {
  try {
    const response = await databases.listDocuments(dbId, colIdnote);
    console.log("Documents listed successfully:", response);
    return response.documents || [];
  } catch (error) {
    console.error("Error listing documents:", error);
    throw error;
  }
};

// 🔹 Utility: Create new document
const CreateDoc = async (dbId, colIdnote, data, id = null) => {
  try {
    const response = await databases.createDocument(
      dbId,
      colIdnote,
      id || ID.unique(),
      data
    );
    console.log("Document created successfully:", response);
    return response;
  } catch (error) {
    console.error("Error creating document:", error);
    throw error;
  }
};

// 🔹 Utility: Update document
const UpdateDoc = async (dbId, colIdnote, docId, data) => {
  try {
    const response = await databases.updateDocument(
      dbId,
      colIdnote,
      docId,
      data
    );
    return response;
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
};

// 🔹 Utility: Delete document
const DeleteDoc = async (dbId, colIdnote, docId) => {
  try {
    const response = await databases.deleteDocument(dbId, colIdnote, docId);
    console.log("Document deleted successfully:", response);
    
    return response;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

// 🔹 Note Service Wrapper
const noteService = {
  async getNote() {
    return await ListDoc(config.databaseId, config.collectionId.notes);
  },

  async addNote(text) {
    const note = { text: String(text) || "Empty note" };
    return await CreateDoc(config.databaseId, config.collectionId.notes, note);
  },

  async editNote(id, newText) {
    const updatedNote = { text: String(newText) || "Updated note" };
    return await UpdateDoc(config.databaseId, config.collectionId.notes, id, updatedNote);
  },

  async deleteNote(id) {
    return await DeleteDoc(config.databaseId, config.collectionId.notes, id);
  },
};

export default noteService;
// export { client, config, CreateDoc, databases, DeleteDoc, ListDoc, UpdateDoc };
export { account };

