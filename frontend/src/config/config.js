import axios from "axios";

const baseURI = import.meta.env.VITE_BACKEND_URL

export async function getData(){
    console.log("GET DATA CALLED IN CONGI")
    try {
      const res = await axios.get(`${baseURI}/allData`);
      console.log("API GET DATA  call response:", res.data);
      return res.data.data;
    } catch (e) {
      console.log("ERROR IN GET DATA", e);
      throw e;  // rethrow to handle errors in the calling code
    }
  }

export async function getImageDescription(grade, subject, chapter, figNo) {
  console.log("GET DESCRIPTION CALLED IN CONGI called")
  try {
    const res = await axios({
      url: `${baseURI}/figData`,
      method: "POST",
      data: {
        grade,
        subject,
        chapter,
        figNo,
      },
    });
    console.log("API call response:", res);
    return res.data;
  } catch (e) {
    console.log("ERROR IN GET DESCRIPTION", e);
    throw e;  // rethrow to handle errors in the calling code
  }
}

export async function updateUserReview(userReview, grade, subject, chapter, figNo) {
  try {
    const res =   axios({
      // Endpoint to send files
      url: `${baseURI}/review`,
      method: "POST",
      // Attaching the form data
      data: {
        review: userReview,
        grade: grade,
        subject: subject,
        chapter: chapter,
        figNo: figNo,
      },
    })
    console.log("REview ADDED TO DB",res);
    return res;

  } catch (e) {
    console.log("ERROR IN UPDATE USER REVIEW", e);
    throw e;  // rethrow to handle errors in the calling code
  }

}

export const uploadImage = async (file, email, metadata) => {
  // Create a FormData object to send the file
  const formData = new FormData();
  formData.append('image', file);
  formData.append('email', email);
  formData.append('metadata', JSON.stringify(metadata));

  // Send the data to your server
  const response = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  return await response.json();
};

export default getImageDescription;
