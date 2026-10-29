import axios from "axios";

// Use the environment variable with a fallback
export const baseURI = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Configure axios defaults
axios.defaults.baseURL = baseURI;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.timeout = 90000; // the free-tier server can take ~45 s to wake up

export const getData = async () => {
  try {
    const res = await axios.get(`${baseURI}/api/allData`);
    return res.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};

// export async function getImageDescription(grade, subject, chapter, figNo) {
//   console.log("GET DESCRIPTION CALLED IN CONGI called")
//   try {
//     const res = await axios({
//       url: `${baseURI}/figData`,
//       method: "POST",
//       data: {
//         grade,
//         subject,
//         chapter,
//         figNo,
//       },
//     });
//     console.log("API call response:", res);
//     return res.data;
//   } catch (e) {
//     console.log("ERROR IN GET DESCRIPTION", e);
//     throw e;  // rethrow to handle errors in the calling code
//   }
// }

// Keyword search across the library, optionally within one collection
export async function searchImagesByKeyword(keyword, collection) {
  const res = await axios.post(`${baseURI}/api/search`, {
    keyword,
    collection: collection || undefined,
  });
  return res.data;
}

// Collections (folders) and their images, one page at a time
export async function getCollections() {
  const res = await axios.get(`${baseURI}/api/collections`);
  return res.data.data;
}

export async function getCollectionImages(id, page = 1, limit = 24) {
  const res = await axios.get(`${baseURI}/api/collections/${encodeURIComponent(id)}/images`, {
    params: { page, limit },
  });
  return res.data;
}

// 3. Updated version of getImageDescription to work with optional figNo
export async function getImageDescription(grade, subject, chapter, figNo) {
  try {
    if (figNo) {
      const res = await axios({
        url: `${baseURI}/api/figData`,
        method: "POST",
        data: {
          grade,
          subject,
          chapter,
          figNo,
        },
      });
      return res.data;
    } else {
      const res = await axios({
        url: `${baseURI}/api/chapterImages`,
        method: "POST",
        data: {
          grade,
          subject,
          chapter,
        },
      });
      return res.data;
    }
  } catch (error) {
    console.error("Error getting image description:", error);
    throw error;
  }
}

export async function updateUserReview(userReview, grade, subject, chapter, figNo, imageData) {
  try {
    const res = await axios({
      url: `${baseURI}/api/review`,
      method: "POST",
      data: {
        review: userReview,
        standard: `Class ${grade}`,
        subject: subject,
        chapter: typeof chapter === 'object' ? chapter.name : chapter,
        figNo: figNo || undefined,
        image_name: imageData?.image_name
      },
    });
    return res;
  } catch (error) {
    console.error("Error updating review:", error);
    throw error;
  }
}

export const uploadImage = async (file, email, metadata) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('email', email);
  formData.append('metadata', JSON.stringify(metadata));

  const response = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  return await response.json();
};

// Function to call the /askMore endpoint
export async function askMore(figNo, userMessage, selectedLanguage, context) {
  const apiURL = `${baseURI}/api/askMore`;
  
  try {
    const requestData = {
      fig_no: figNo,
      user_query: userMessage,
      language: selectedLanguage || 'en-US',
      context: context || {}
    };

    const response = await axios.post(apiURL, requestData, {
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error in askMore API:", error);
    throw error;
  }
}

export const getUserImageDescription = async (formData) => {
  try {
    const response = await axios.post(`${baseURI}/api/user-image-description`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error getting user image description:", error);
    throw error;
  }
};

// Function to get PDF download URL
export const getPdfDownloadUrl = async (grade, subject, chapter, figNo, image_name) => {
  try {
    // Log the backend URL and request data
    console.log('=== PDF Download Request ===');
    
    // Validate image_name is present
    if (!image_name) {
      throw new Error('image_name is required for PDF download');
    }

    // Send ONLY the image_name parameter
    const requestData = {
      image_name: image_name
    };

    console.log('Making PDF download request with:', requestData);

    const response = await axios({
      url: '/api/pdf/download',
      method: "POST",
      data: requestData,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.error || 'Failed to get PDF URL');
    }

    console.log('PDF download response:', response.data);
    return response.data;

  } catch (error) {
    console.error('PDF download request failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

export default getImageDescription;
// ---------- Description generation ----------
// Signed-in users send a short-lived Appwrite token so the server can check admin rights.
let cachedJwt = null;
async function authHeaders() {
  if (cachedJwt && cachedJwt.expires > Date.now()) return { Authorization: `Bearer ${cachedJwt.jwt}` };
  try {
    const { account } = await import('../services/appwriteService');
    const { jwt } = await account.createJWT();
    cachedJwt = { jwt, expires: Date.now() + 10 * 60 * 1000 }; // tokens last 15 minutes; renew after 10
    return { Authorization: `Bearer ${jwt}` };
  } catch {
    return {}; // not signed in
  }
}

const errorMessage = (err, fallback) => err.response?.data?.error || fallback;

export async function getMe() {
  const res = await axios.get(`${baseURI}/api/me`, { headers: await authHeaders() });
  return res.data.user;
}

export async function getDescribeModels() {
  const res = await axios.get(`${baseURI}/api/describe/models`);
  return res.data.models;
}

export async function getDescriptionHistory(recordId) {
  const res = await axios.get(`${baseURI}/api/records/${recordId}/descriptions`);
  return res.data.data;
}

export async function generateDescriptionFor(recordId, model) {
  try {
    const res = await axios.post(`${baseURI}/api/records/${recordId}/descriptions`, { model }, { timeout: 150000 });
    return res.data.data;
  } catch (err) {
    throw new Error(errorMessage(err, 'The description could not be generated. Try again or choose another model.'));
  }
}

export async function saveDescriptionToLibrary(recordId, generationId) {
  try {
    const res = await axios.post(
      `${baseURI}/api/records/${recordId}/descriptions/${generationId}/save`,
      {},
      { headers: await authHeaders() },
    );
    return res.data.data;
  } catch (err) {
    throw new Error(errorMessage(err, 'The description could not be saved. Try again.'));
  }
}
