import { ID } from 'appwrite';
import { storage, appwriteConfig } from './appwrite';

// Storage bucket ID - you'll need to create this in your Appwrite console
const BUCKET_ID = 'officer-documents'; // You can change this name

class StorageService {
  // Upload a file to Appwrite Storage
  async uploadFile(file, fileName = null) {
    try {
      // Create a unique file name if not provided
      const uniqueFileName = fileName || `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Upload file to storage
      const uploadedFile = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file
      );

      console.log('✅ File uploaded successfully:', uploadedFile.$id);
      return {
        fileId: uploadedFile.$id,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        mimeType: uploadedFile.mimeType,
        url: this.getFileUrl(uploadedFile.$id)
      };
    } catch (error) {
      console.error('❌ File upload failed:', error);
      throw error;
    }
  }

  // Get file URL for display/download
  getFileUrl(fileId) {
    return `${appwriteConfig.endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${appwriteConfig.projectId}`;
  }

  // Delete a file from storage
  async deleteFile(fileId) {
    try {
      await storage.deleteFile(BUCKET_ID, fileId);
      console.log('✅ File deleted successfully:', fileId);
    } catch (error) {
      console.error('❌ File deletion failed:', error);
      throw error;
    }
  }

  // List all files in the bucket
  async listFiles() {
    try {
      const files = await storage.listFiles(BUCKET_ID);
      return files.files;
    } catch (error) {
      console.error('❌ Failed to list files:', error);
      throw error;
    }
  }

  // Get file details
  async getFile(fileId) {
    try {
      const file = await storage.getFile(BUCKET_ID, fileId);
      return file;
    } catch (error) {
      console.error('❌ Failed to get file:', error);
      throw error;
    }
  }
}

export default new StorageService();
