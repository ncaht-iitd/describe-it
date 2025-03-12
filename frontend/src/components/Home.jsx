import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getData } from "../config/config";

import "../index.css";
import Navbar from "./Navbar";
import AccessibilityMenu from "./AccessibilityMenu";

import libraryBackground from "../assets/images/library-background.png";

let allData = null;

function Home() {
  const [grade, setGrade] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [figNo, setFigNo] = useState("");

  const [gradeList, setGradeList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [chapterList, setChapterList] = useState([]);
  const [figNoList, setFigNoList] = useState([]);

  const getDataBlob = async () => {
    try {
      const data = await getData();
      console.log(data);
      allData = data;
      console.log(allData);
      setGradeList(Object.keys(data));

      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  useEffect(() => {
    getDataBlob();
  }, []);

  function handleSearch(e) {
    e.preventDefault();
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
    navigate(
      `/description?grade1=${encodeURIComponent(
        grade
      )}&subject1=${encodeURIComponent(subject)}&chapter1=${encodeURIComponent(
        chapter
      )}&figNo1=${encodeURIComponent(figNo)}`
    );
  }

  useEffect(() => {
    console.log(allData);
    allData && setSubjectList(Object.keys(allData[grade]));
  }, [grade]);

  useEffect(() => {
    allData && setChapterList(Object.keys(allData[grade][subject]));
    console.log(subjectList);
  }, [subject]);

  useEffect(() => {
    console.log(grade, subject, chapter);
    allData && console.log(allData[grade][subject][chapter]);
    allData && setFigNoList(allData[grade][subject][chapter]);
  }, [chapter]);

  const aboutRef = useRef(null);

  const navigate = useNavigate();

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar scrollToAbout={scrollToAbout} />
      <AccessibilityMenu />
      {/* Main content area with library background */}
      <div 
        className="flex flex-col md:flex-row flex-grow"
        style={{
          backgroundImage: `url(${libraryBackground})`,
          backgroundRepeat: 'repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Search functionality section - now takes full width */}
        <div className="w-full bg-black bg-opacity-10 text-white p-4 md:p-64 flex flex-col justify-between">
          <div className="flex flex-col items-center justify-center flex-grow mt-16 md:mt-20"> {/* Added mt-16 md:mt-20 for spacing */}
            <h2 className="text-2xl md:text-5xl font-poppins-normal mb-4 md:mb-8 text-center">
            Search for Image <br /> Descriptions with Us
            </h2>

            <form
              className="bg-white opacity-85 p-4 md:p-6 rounded-lg shadow-md w-full max-w-4xl font-alegreya-light text-black 
              flex flex-col md:flex-row gap-3 md:gap-4 justify-between items-center"
            >
              <div className="w-full md:w-auto">
                <label className="block text-gray-700 text-sm">Class</label>
                <select
                  className="p-2 border rounded-lg w-full"
                  value={grade}
                  onChange={(e) => {
                    setGrade(e.target.value);
                  }}
                >
                  <option value="">Select Class</option>
                  {gradeList.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-auto">
                <label className="block text-gray-700 text-sm">Subject</label>
                <select
                  className="p-2 border rounded-lg w-full"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value);
                  }}
                >
                  <option value="">Select Subject</option>
                  {subjectList.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-auto">
                <label className="block text-gray-700 text-sm">Chapter</label>
                <select
                  className="p-2 border rounded-lg w-full"
                  value={chapter}
                  onChange={(e) => {
                    setChapter(e.target.value);
                  }}
                >
                  <option value="">Select Chapter</option>
                  {chapterList.map((chapter) => (
                    <option key={chapter} value={chapter}>
                      {chapter}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-auto">
                <label className="block text-gray-700 text-sm">Fig No.</label>
                <div className="flex">
                  <input
                    type="text"
                    className="p-2 border rounded-l-lg w-full max-w-24"
                    placeholder="Figure number"
                    value={figNo}
                    onChange={(e) => setFigNo(e.target.value)}
                  />
                  <button
                    type="submit"
                    onClick={handleSearch}
                    className="p-2 border bg-gray-600 text-white rounded-r-lg"
                  >Go
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* About Section - remains unchanged */}
      <div ref={aboutRef} className="bg-black py-8 md:py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-poppins-bold mb-4 md:mb-8 text-center text-yellow-400">
            About Us
          </h2>
          <div className="max-w-3xl mx-auto font-alegreya-light text-white text-sm md:text-base">
            <p className="mb-2 md:mb-4">
              NCAHT (National Center for Assistive Health Technologies) is an
              initiative of Indian Council for Medical Research (ICMR) led by
              IIT Delhi and AIIMS Delhi. Our centre shares a collective vision
              of enabling disability inclusion through assistive technology by
              developing a range of AT solutions and services designed to ensure
              that every individual can live their life to the fullest,
              regardless of their abilities.
            </p>
            <h2 className="text-2xl md:text-3xl font-poppins-bold mb-4 md:mb-8 text-center text-yellow-400">
              Why <span className="text-white">VisionText?</span>
            </h2>
            <p className="mb-2 md:mb-4">
              In today's era everything from day to day activities to education
              is being digitalized. A major issue which came into light while
              researching for this project was lack of clarity in image
              descriptions and alt text for complex concepts such as Geometry.
              Our website aims to bridge this gap by providing accessible image
              descriptions for educational materials.
            </p>
            <p className="mb-2 md:mb-4">
              VisionText is making a significant contribution to accessible
              education by:
            </p>
            <ul className="list-disc pl-4 md:pl-6 mb-2 md:mb-4 text-sm md:text-base">
              <li>
                Providing detailed descriptions of images found in textbooks
              </li>
              <li>
                Enabling visually impaired students to access visual information
              </li>
              <li>Supporting inclusive learning environments</li>
              <li>
                Enhancing the overall learning experience for all students
              </li>
            </ul>
            <p className="text-sm md:text-base">
              By making educational content more accessible, we're taking a step
              towards ensuring equal opportunities in education for all.
            </p>
          </div>
        </div>
      </div>
      <div className="bg-white text-black py-8 md:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-poppins-bold mb-4 md:mb-8 text-center text-yellow-500">
            Contact Us
          </h2>
          <div className="flex flex-col md:flex-row font-poppins-normal justify-between items-start md:items-center">
            <div className="mb-6 md:mb-0 md:w-1/2">
              <p className="mb-2 md:mb-4">
                <strong>Address:</strong>
                <br />
                Room No GA3, Research and Innovation Park, Indian Institute of
                Technology Delhi (IITD), Hauz Khas, New Delhi- 110016
              </p>
              <p className="mb-2 md:mb-4">
                <strong>Contact:</strong>
                <br />
                +91 11 26596080
                <br />
                <a
                  href="mailto:ncaht.iitd@gmail.com"
                  className="text-yellow-500"
                >
                  ncaht.iitd@gmail.com
                </a>
                ,
                <a
                  href="mailto:assistech.iitd@gmail.com"
                  className="text-yellow-500"
                >
                  {" "}
                  assistech.iitd@gmail.com
                </a>
              </p>
              <p className="mb-2 md:mb-4">
                <strong>Opening Hours:</strong>
                <br />
                Mon - Fri
                <br />
                10 am – 6:00 pm
              </p>
              <p className="mb-2 md:mb-4">
                <a
                  href="https://www.linkedin.com/company/ncaht-iitdelhi/posts/?feedView=all"
                  className="text-yellow-500 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit us on LinkedIn
                </a>
              </p>
            </div>
            <div className="w-full md:w-1/2">
              <iframe
                title="NCAHT Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1758.0595160101248!2d77.19154285630076!3d28.545380785862!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d1df5d40b8051%3A0xe7c5426de4885f4e!2sIIT%20Delhi%20Research%20and%20Innovation%20Park!5e0!3m2!1sen!2sin!4v1234567890"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;