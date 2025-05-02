// src/services/appwriteService.js
import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from 'appwrite';

// Log environment variables for debugging
console.log('Appwrite Endpoint:', import.meta.env.VITE_APPWRITE_ENDPOINT);
console.log('Appwrite Project ID:', import.meta.env.VITE_APPWRITE_PROJECT_ID);
console.log('Appwrite Database ID:', import.meta.env.VITE_APPWRITE_DATABASE_ID);
console.log('Appwrite Collection ID:', import.meta.env.VITE_APPWRITE_COLLECTION_ID);
console.log('Appwrite Bucket ID:', import.meta.env.VITE_APPWRITE_BUCKET_ID);

// Initialize Appwrite
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Log client configuration
console.log('Appwrite Client Configuration:', {
  endpoint: client.config.endpoint,
  project: client.config.project
});

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

//New constants
const TACTILE_REQUESTS_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TACTILE_REQUESTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;
const TACTILE_IMAGES_BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;

// Authentication functions
export const getCurrentUser = async () => {
  try {
    const user = await account.get();
    if (!user) {
      throw new Error('No user found');
    }
    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    // If there's a pending request, store it in localStorage
    const pendingRequest = localStorage.getItem('pendingTactileRequest');
    if (pendingRequest) {
      // Don't throw the error, just return null to allow the login flow to continue
      return null;
    }
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    // Use createEmailPasswordSession for email/password authentication
    await account.createEmailPasswordSession(email, password);
    return true;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await account.deleteSession('current');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const signup = async (email, password, name) => {
  try {
    // Create the user account
    const user = await account.create(ID.unique(), email, password, name);
    
    // Create a session for the new user
    await account.createEmailSession(email, password);
    
    return user;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const googleAuth = () => {
  try {
    account.createOAuth2Session(
      'google',
      `${window.location.origin}/dashboard`,
      `${window.location.origin}/login`
    );
  } catch (error) {
    console.error('Google auth error:', error);
    throw error;
  }
};

export const sendVerificationEmail = async () => {
  try {
    return await account.createVerification(window.location.origin + '/verify-email');
  } catch (error) {
    console.error('Send verification email error:', error);
    throw error;
  }
};

export const confirmVerification = async (userId, secret) => {
  try {
    return await account.updateVerification(userId, secret);
  } catch (error) {
    console.error('Confirm verification error:', error);
    throw error;
  }
};

// Add this function after the client initialization
export const verifyStorageBucket = async () => {
  try {
    // Try to list files in the bucket as a way to verify it exists
    await storage.listFiles(TACTILE_IMAGES_BUCKET_ID);
    console.log('Storage bucket verified');
    return true;
  } catch (error) {
    console.error('Storage bucket verification failed:', error);
    if (error.code === 404) {
      throw new Error(`Bucket not found. Please create a bucket named "tactile_images" in your Appwrite console and update VITE_APPWRITE_BUCKET_ID in your .env file.`);
    }
    throw error;
  }
};

// Add this function after the verifyStorageBucket function
export const verifyDatabaseAccess = async () => {
  try {
    // Try to list documents with a limit of 1 to verify access to collection
    await databases.listDocuments(
      TACTILE_REQUESTS_DATABASE_ID,
      TACTILE_REQUESTS_COLLECTION_ID,
      [
        // Add a query to limit to just one document
        Query.limit(1)
      ]
    );
    console.log('Database collection verified');
    return true;
  } catch (error) {
    console.error('Database collection verification failed:', error);
    if (error.code === 404) {
      throw new Error(`Collection not found. Please create a collection named "requests" in your database "${TACTILE_REQUESTS_DATABASE_ID}" in Appwrite console.`);
    } else if (error.code === 401 || error.code === 403) {
      throw new Error(`Permission denied. Make sure your user has access to the collection "${TACTILE_REQUESTS_COLLECTION_ID}".`);
    }
    throw error;
  }
};

// Tactile request functions
export const submitTactileRequest = async (imageFile, description, additionalInfo = '') => {
  try {
    // 1. Get the current user
    const user = await getCurrentUser();
    if (!user) {
      // Store temporary data in localStorage
      const tempRequest = {
        imageDataUrl: URL.createObjectURL(imageFile), // Use URL.createObjectURL for temporary preview
        description,
        additionalInfo,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('pendingTactileRequest', JSON.stringify(tempRequest));
      throw new Error('User must be logged in to submit a request');
    }

    console.log('Uploading image to bucket:', TACTILE_IMAGES_BUCKET_ID);
    console.log('Current user:', user.$id);
    
    // 2. Upload the image to storage
    let fileUpload;
    try {
      // First try with permissions
      try {
        fileUpload = await storage.createFile(
          TACTILE_IMAGES_BUCKET_ID,
          ID.unique(),
          imageFile,
          [
            Permission.read(Role.any()), // Anyone can read
            Permission.update(Role.user(user.$id)), // Only the user can update
            Permission.delete(Role.user(user.$id)) // Only the user can delete
          ]
        );
      } catch (permError) {
        // If permissions parameter is not supported, try without it
        if (permError.message && permError.message.includes('parameter')) {
          console.log('Trying file upload without permissions parameter');
          fileUpload = await storage.createFile(
            TACTILE_IMAGES_BUCKET_ID,
            ID.unique(),
            imageFile
          );
        } else {
          throw permError;
        }
      }
      
      console.log('File uploaded successfully:', fileUpload);
    } catch (error) {
      console.error('File upload error:', error);
      if (error.code === 401) {
        throw new Error('Unauthorized: Make sure the storage bucket exists and has proper permissions set');
      } else if (error.code === 403) {
        throw new Error('Permission denied: You do not have permission to upload files to this bucket');
      } else {
        throw new Error('Failed to upload image: ' + error.message);
      }
    }

    // 3. Create the request in the database with the specific attributes
    const requestData = {
      userId: user.$id,
      imageId: fileUpload.$id,
      description: description,
      additionalInfo: additionalInfo || '',
      status: 'Requested',
      requestDate: new Date().toISOString(),
      estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Setting default to 7 days from now
    };
    
    console.log('Creating document with data:', requestData);
    
    try {
      let request;
      // First try with permissions
      try {
        request = await databases.createDocument(
          TACTILE_REQUESTS_DATABASE_ID,
          TACTILE_REQUESTS_COLLECTION_ID,
          ID.unique(),
          requestData,
          [
            Permission.read(Role.user(user.$id)), // Only the user can read their own requests
            Permission.update(Role.user(user.$id)), // Only the user can update
            Permission.delete(Role.user(user.$id)) // Only the user can delete
          ]
        );
      } catch (permError) {
        // If permissions parameter is not supported, try without it
        if (permError.message && permError.message.includes('parameter')) {
          console.log('Trying document creation without permissions parameter');
          request = await databases.createDocument(
            TACTILE_REQUESTS_DATABASE_ID,
            TACTILE_REQUESTS_COLLECTION_ID,
            ID.unique(),
            requestData
          );
        } else {
          throw permError;
        }
      }
  
      console.log('Document created successfully:', request);
  
      // Clear any pending request
      localStorage.removeItem('pendingTactileRequest');
  
      return request;
    } catch (error) {
      console.error('Document creation error:', error);
      if (error.code === 401) {
        throw new Error('Unauthorized: Make sure the database and collection exist and have proper permissions set');
      } else if (error.code === 403) {
        throw new Error('Permission denied: You do not have permission to create documents in this collection');
      } else {
        throw new Error('Failed to create request: ' + error.message);
      }
    }
  } catch (error) {
    console.error('Submit tactile request error:', error);
    throw error;
  }
};

export const getPendingTactileRequest = () => {
  try {
    const pendingRequestStr = localStorage.getItem('pendingTactileRequest');
    if (!pendingRequestStr) return null;
    
    // We have to parse the string, but the image file will be lost in serialization
    // The actual file data will have to be stored in a different way
    const parsed = JSON.parse(pendingRequestStr);
    
    // The imageFile property is stored in a different format for localStorage
    // It might be a binary string or URL which we would need to convert back
    // For now, we'll trust that ImageUpload will store this correctly
    return parsed;
  } catch (error) {
    console.error('Error getting pending request:', error);
    return null;
  }
};

export const clearPendingTactileRequest = () => {
  localStorage.removeItem('pendingTactileRequest');
};

// Admin-only function for handling image upload
export const uploadTactileImage = async (requestId, imageFile) => {
  try {
    // 1. Upload the image to storage
    const fileUpload = await storage.createFile(
      TACTILE_IMAGES_BUCKET_ID,
      ID.unique(),
      imageFile
    );

    // 2. Update the request document with the image ID
    await databases.updateDocument(
      TACTILE_REQUESTS_DATABASE_ID,
      TACTILE_REQUESTS_COLLECTION_ID,
      requestId,
      {
        imageId: fileUpload.$id,
        status: 'Requested'
      }
    );

    return {
      success: true,
      imageId: fileUpload.$id
    };
  } catch (error) {
    console.error('Upload tactile image error:', error);
    throw error;
  }
};

export const getUserTactileRequests = async () => {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await databases.listDocuments(
      TACTILE_REQUESTS_DATABASE_ID,
      TACTILE_REQUESTS_COLLECTION_ID,
      [
        Query.equal('userId', user.$id),
        Query.orderDesc('requestDate')
      ]
    );

    // For each request, get the image URL
    const requests = await Promise.all(response.documents.map(async (doc) => {
      // Get image preview URL
      let imagePreview = null;
      try {
        imagePreview = storage.getFileView(
          TACTILE_IMAGES_BUCKET_ID,
          doc.imageId
        );
      } catch (e) {
        console.error('Error getting image preview:', e);
      }

      return {
        id: doc.$id,
        imagePreview,
        description: doc.description,
        additionalInfo: doc.additionalInfo || '',
        status: doc.status,
        requestDate: doc.requestDate,
        estimatedCompletionDate: doc.estimatedCompletionDate
      };
    }));

    return requests;
  } catch (error) {
    console.error('Get tactile requests error:', error);
    throw error;
  }
};

export const getTactileRequestDetails = async (requestId) => {
  try {
    const document = await databases.getDocument(
      TACTILE_REQUESTS_DATABASE_ID,
      TACTILE_REQUESTS_COLLECTION_ID,
      requestId
    );

    // Get image preview URL
    let imagePreview = null;
    try {
      imagePreview = storage.getFileView(
        TACTILE_IMAGES_BUCKET_ID,
        document.imageId
      );
    } catch (e) {
      console.error('Error getting image preview:', e);
    }

    return {
      id: document.$id,
      imagePreview,
      description: document.description,
      additionalInfo: document.additionalInfo || '',
      status: document.status,
      requestDate: document.requestDate,
      estimatedCompletionDate: document.estimatedCompletionDate
    };
  } catch (error) {
    console.error('Get tactile request details error:', error);
    throw error;
  }
};

export const isLoggedIn = async () => {
  try {
    await account.get();
    return true;
  } catch (error) {
    return false;
  }
};

// Admin functions
export const getAllTactileRequests = async () => {
  try {
    const response = await databases.listDocuments(
      TACTILE_REQUESTS_DATABASE_ID,
      TACTILE_REQUESTS_COLLECTION_ID,
      [
        Query.orderDesc('requestDate')
      ]
    );

    // For each request, get the image URL and user details
    const requests = await Promise.all(response.documents.map(async (doc) => {
      // Get image preview URL
      let imagePreview = null;
      try {
        imagePreview = storage.getFilePreview(
          TACTILE_IMAGES_BUCKET_ID,
          doc.imageId,
          300,
          300
        );
      } catch (e) {
        console.error('Error getting image preview:', e);
      }

      // Get user details
      let userDetails = null;
      try {
        userDetails = await account.get(doc.userId);
      } catch (e) {
        console.error('Error getting user details:', e);
      }

      return {
        id: doc.$id,
        imagePreview,
        description: doc.description,
        additionalInfo: doc.additionalInfo,
        status: doc.status,
        requestDate: doc.requestDate,
        estimatedCompletionDate: doc.estimatedCompletionDate,
        userId: doc.userId,
        userName: userDetails?.name || 'Unknown User',
        userEmail: userDetails?.email || 'Unknown Email'
      };
    }));

    return requests;
  } catch (error) {
    console.error('Get all tactile requests error:', error);
    throw error;
  }
};

export const updateTactileRequestStatus = async (requestId, status, estimatedCompletionDate = null) => {
  try {
    const updateData = {
      status,
      ...(estimatedCompletionDate && { estimatedCompletionDate })
    };

    await databases.updateDocument(
      TACTILE_REQUESTS_DATABASE_ID,
      TACTILE_REQUESTS_COLLECTION_ID,
      requestId,
      updateData
    );

    return true;
  } catch (error) {
    console.error('Update tactile request status error:', error);
    throw error;
  }
};

export const deleteTactileRequest = async (requestId) => {
  try {
    // First get the request to get the image ID
    const request = await databases.getDocument(
      TACTILE_REQUESTS_DATABASE_ID,
      TACTILE_REQUESTS_COLLECTION_ID,
      requestId
    );

    // Delete the image from storage
    if (request.imageId) {
      await storage.deleteFile(TACTILE_IMAGES_BUCKET_ID, request.imageId);
    }

    // Delete the document
    await databases.deleteDocument(
      TACTILE_REQUESTS_DATABASE_ID,
      TACTILE_REQUESTS_COLLECTION_ID,
      requestId
    );

    return true;
  } catch (error) {
    console.error('Delete tactile request error:', error);
    throw error;
  }
};

export const isAdmin = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    
    // Check if user has admin label
    const userLabels = user.labels || [];
    return userLabels.includes('Admin');
  } catch (error) {
    console.error('Check admin status error:', error);
    return false;
  }
};

// Update the testAppwriteConnection function to include database and storage verification
export const testAppwriteConnection = async () => {
  try {
    // First verify client configuration
    console.log('Appwrite Client Configuration:', {
      endpoint: client.config.endpoint,
      project: client.config.project,
      database: TACTILE_REQUESTS_DATABASE_ID,
      collection: TACTILE_REQUESTS_COLLECTION_ID,
      bucket: TACTILE_IMAGES_BUCKET_ID
    });

    // Try to get current session
    let isAuthenticated = false;
    try {
      const user = await account.get();
      console.log('User authenticated:', user);
      isAuthenticated = true;
    } catch (error) {
      if (error.code === 401) {
        console.log('Not logged in - this is expected for guests');
        isAuthenticated = false; // Connection is working, just not authenticated
      } else {
        throw error;
      }
    }

    // Verify storage bucket if authenticated
    if (isAuthenticated) {
      try {
        await verifyStorageBucket();
        console.log('Storage bucket verified');
      } catch (error) {
        console.error('Storage bucket verification failed:', error);
      }

      try {
        await verifyDatabaseAccess();
        console.log('Database access verified');
      } catch (error) {
        console.error('Database access verification failed:', error);
      }
    }

    return true;
  } catch (error) {
    console.error('Appwrite connection failed:', error);
    return false;
  }
};

export { account, databases, storage };