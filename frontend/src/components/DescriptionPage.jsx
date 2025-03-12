import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Chatbot from "./Chatbot";  

import { Book, Search, Download, FileEdit } from 'lucide-react';

import logo from "../assets/images/NCAHT-Logo.png";

import "../index.css";
import HTMLparser from "./HTMLparser";
import getImageDescription, { getData, updateUserReview } from "../config/config";

let allData = null;

const DescriptionPage = () => {
  const [searchParams] = useSearchParams();
  const [flag, setFlag] = useState(true);

  const grade1 = searchParams.get('grade1');
  const subject1 = searchParams.get('subject1');
  const chapter1 = searchParams.get('chapter1');
  const figNo1 = searchParams.get('figNo1');

  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [figNo, setFigNo] = useState("");

  const [gradeList, setGradeList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [chapterList, setChapterList] = useState([]);
  const [figNoList, setFigNoList] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reviews, setReviews] = useState([]);
  const [imgUrl, setImgUrl] = useState("");

  const [showReview, setShowReview] = useState(false);
  const [userReview, setUserReview] = useState("");
  const [showUserReview, setShowUserReview] = useState(false);

  const navigate = useNavigate();

  const fetchDescription = async (grade, subject, chapter, figNo) => {
    try {
      const imgDesc = await getImageDescription(grade, subject, chapter, figNo);

      setDescription(imgDesc.description);
      setImgUrl(imgDesc.image_url);
      setReviews(imgDesc.reviews);
      setTitle(`${imgDesc.chapter} ${imgDesc.fig_no}`);
    } catch (error) {
      console.error("Failed to fetch description:", error);
      return null;
    }
  };

  const getDataBlob = async () => {
    try {
      const data = await getData();
      allData = data;
      setGradeList(Object.keys(data));
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  useEffect(() => {
    getDataBlob();
    fetchDescription(grade1, subject1, chapter1, figNo1);
  }, []);

  // Cleanup speech synthesis
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Cascading dropdown logic
  useEffect(() => {
    allData && setSubjectList(Object.keys(allData[grade] || {}));
  }, [grade]);

  useEffect(() => {
    allData && setChapterList(Object.keys(allData[grade]?.[subject] || {}));
  }, [subject]);

  useEffect(() => {
    allData && setFigNoList(allData[grade]?.[subject]?.[chapter] || []);
  }, [chapter]);

  function handleSearch(e) {
    e.preventDefault();
    setFlag(false);

    const figIndex = figNoList.findIndex((fig) => fig === figNo);

    if (figIndex === -1) {
      console.log("Image not found");
      navigate(
        `/image-not-found?grade=${encodeURIComponent(
          grade
        )}&subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(
          chapter
        )}&figNo=${encodeURIComponent(figNo)}`
      );
      return;
    }

    console.log([grade, subject, encodeURIComponent(chapter), figNo]);
    fetchDescription(grade, subject, chapter, figNo);
}


  async function handleUserReview(e) {
    e.preventDefault();

    const reviewParams = flag 
      ? [userReview, grade1, subject1, chapter1, figNo1]
      : [userReview, grade, subject, chapter, figNo];

    try {
      await updateUserReview(...reviewParams);
      console.log("Review added successfully");
      reviews.push(userReview);
      setUserReview("");
      setShowUserReview(false);
    } catch (error) {
      console.error("Failed to add review:", error);
    }
  }

  return (
    <div 
      class="description-page"
      className="min-h-screen flex flex-col items-center justify-center bg-white"
      aria-label="VisionText Description Page"
    >
      <div className="absolute top-4 left-4 text-gray-800">
        VisionText
      </div>

      <div className="absolute top-4 right-4 flex items-center space-x-4">
        <a
          href="https://www.ncaht.in/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={logo}
            alt="NCAHT Logo: N C A H T National Center for Assistive Health Technologies"
            className="h-12"
          />
        </a>
      </div>

      <form className="w-full max-w-4xl p-4 mb-4">
        <div className="flex justify-between mb-4">
          <div className="flex space-x-4">
            {[
              { 
                label: "Class", 
                value: grade, 
                setter: setGrade, 
                options: gradeList 
              },
              { 
                label: "Subject", 
                value: subject, 
                setter: setSubject, 
                options: subjectList 
              },
              { 
                label: "Chapter", 
                value: chapter, 
                setter: setChapter, 
                options: chapterList 
              }
            ].map(({ label, value, setter, options }) => (
              <div key={label}>
                <label 
                  className="block text-gray-700"
                  htmlFor={`${label.toLowerCase()}-select`}
                >
                  {label}
                </label>
                <select
                  id={`${label.toLowerCase()}-select`}
                  className="p-2 border rounded-lg bg-white text-gray-800"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  aria-label={`Select ${label.toLowerCase()}`}
                >
                  <option value="">{`Select ${label}`}</option>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          
          <div>
            <label 
              className="block text-gray-700"
              htmlFor="figure-search"
            >
              Search for figure...
            </label>
            <div className="flex">
              <input
                id="figure-search"
                type="text"
                className="p-2 border rounded-l-lg bg-white text-gray-800"
                placeholder="Enter figure number"
                value={figNo}
                onChange={(e) => setFigNo(e.target.value)}
                aria-label="Enter figure number to search"
              />
              <button
                type="submit"
                onClick={handleSearch}
                className="p-2 border bg-gray-300 rounded-r-lg"
                aria-label="Search for figure"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </form>

      <div 
        className="w-full max-w-4xl p-8 bg-white shadow-md rounded-lg flex"
        role="main"
        aria-label="Figure Description and Details"
      >
        <div className="w-1/2 flex flex-col items-center">
          <img 
            src={imgUrl} 
            alt="Searched Image" 
            className="w-3/4 mb-4" 
            style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
            aria-describedby="image-description"
          />

          <div className="flex space-x-4">
          <button
              className="p-2 rounded bg-green-500 text-white"
              aria-label="Read reviews by other students"
              onClick={() => setShowReview(!showReview)}
            >
            <Book className="w-6 h-6" />
            </button>

            <button
              className="p-2 rounded bg-red-500 text-white"
              aria-label="Download Tactile version of the Figure"
            >
              <Download className="w-6 h-6" />
            </button>
          </div>

          {showReview && (
            <div className="p-4 m-4 bg-white rounded-lg shadow-md w-3/4">
              <h3 className="text-lg font-bold border-b pb-2 mb-4 text-gray-800">
                Reviews
              </h3>
              <ul className="max-h-64 overflow-auto space-y-4">
                {reviews.map((review, idx) => (
                  <li
                    key={idx}
                    className="p-4 bg-gray-100 rounded-lg border border-gray-200 shadow-sm"
                  >
                    {review}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="w-1/2 flex flex-col items-center">
          <h2 className="text-xl font-bold mb-2 text-gray-900">
            {title}
          </h2>
          <p className="text-gray-700 mb-4">
            <HTMLparser htmlString={description} />
          </p>

          <div className="flex space-x-4 items-center">
          <button
            className="flex items-center p-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition duration-300"
            aria-label="Add Review"
            onClick={() => setShowUserReview(!showUserReview)}
          >
            <FileEdit className="w-6 h-6" />
          </button>

            <button
             onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate('/'); // Fallback route
              }
            }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300"
            >
              Go Back
            </button>
          </div>

          {showUserReview && (
            <form
              onSubmit={handleUserReview}
              className="flex flex-col space-y-4 p-4 max-w-md mx-auto bg-white rounded-lg shadow-lg"
            >
              <textarea
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
                className="p-3 h-40 resize-none bg-gray-100 text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write your review here..."
                aria-label="Write your review"
              />
              <button
                type="submit"
                className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-300"
              >
                Submit
              </button>
            </form>
          )}
          <Chatbot 
            figNo={flag ? figNo1 : figNo} 
            description={description} 
          />
        </div>
      </div>
    </div>
  );
};

export default DescriptionPage;