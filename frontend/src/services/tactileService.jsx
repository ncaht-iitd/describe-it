// src/services/tactileService.js
import { ID, Query } from 'appwrite';
import { databases, storage } from './appwriteService';

// Database and Storage constants
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;
const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;

// Get all tactile image requests for current user
export const getUserTactileRequests = async () => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [
        Query.orderDesc('$createdAt')
      ]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      imagePreview: doc.imagePreview,
      requestDate: doc.$createdAt,
      status: doc.status,
      description: doc.description,
      additionalInfo: doc.additionalInfo,
      estimatedCompletionDate: doc.estimatedCompletionDate
    }));
  } catch (error) {
    console.error('Failed to fetch tactile requests:', error);
    throw error;
  }
};

// Get details of a specific tactile image request
export const getTactileRequestDetails = async (requestId) => {
  try {
    const response = await databases.getDocument(
      DATABASE_ID,
      COLLECTION_ID,
      requestId
    );
    return {
      id: response.$id,
      imagePreview: response.imagePreview,
      requestDate: response.$createdAt,
      status: response.status,
      description: response.description,
      additionalInfo: response.additionalInfo,
      estimatedCompletionDate: response.estimatedCompletionDate
    };
  } catch (error) {
    console.error('Failed to fetch request details:', error);
    throw error;
  }
};

// Submit a new tactile image request
export const createTactileRequest = async (requestData) => {
  try {
    // Upload image to storage
    const file = await storage.createFile(
      BUCKET_ID,
      ID.unique(),
      requestData.imageFile
    );

    // Get the file URL
    const fileUrl = storage.getFileView(
      BUCKET_ID,
      file.$id
    );

    // Create document in database
    const response = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID,
      ID.unique(),
      {
        imagePreview: fileUrl,
        status: 'Requested',
        description: requestData.description,
        additionalInfo: requestData.additionalInfo,
        estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      }
    );

    return response.$id;
  } catch (error) {
    console.error('Failed to create tactile request:', error);
    throw error;
  }
};