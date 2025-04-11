import axios from "axios";

export const baseURI = import.meta.env.VITE_BACKEND_URL;

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

// 2. New API route for keyword search
export async function searchImagesByKeyword(grade, subject, chapter, keyword) {
  try {
    const res = await axios({
      url: `${baseURI}/api/search`,
      method: "POST",
      data: {
        grade,
        subject,
        chapter,
        keyword,
      },
    });
    return res.data;
  } catch (error) {
    console.error("Error in keyword search:", error);
    throw error;
  }
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

export default getImageDescription;