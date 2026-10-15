import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import accessibilityIcon from "../assets/images/Webinar-amico.svg";

// Utility Hook for Count Up animation
const useCountUp = (target, duration = 2, shouldStart = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!shouldStart) return;
    
    let start = 0;
    const end = target;
    const incrementTime = 10;
    const totalIncrements = duration * 1000 / incrementTime;
    const increment = end / totalIncrements;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [target, duration, shouldStart]);

  return count;
};

export default function AboutUs({ whyDescribeItRef }) {
    const [startCounting, setStartCounting] = useState(false);
    const count1 = useCountUp(98, 2, startCounting);
    const count2 = useCountUp(2, 2, startCounting);
    const count3 = useCountUp(5, 2, startCounting);
    const count4 = useCountUp(100, 2, startCounting);
  
    return (
      <>
        {/* === About Us Section === */}
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 py-32">    
          <div className="container mx-auto px-12 max-w-7xl">
            <motion.h2 
              className="text-6xl font-poppins-bold text-center text-yellow-400 mb-24"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              About Us
            </motion.h2>
  
            <div className="flex flex-col md:flex-row items-center md:items-start gap-16">
              <motion.div 
                className="md:w-1/2 flex justify-center"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <motion.img
                  src={accessibilityIcon}
                  alt="Accessibility illustration"
                  className="w-96 h-auto rounded-lg shadow-2xl"
                  whileHover={{ 
                    scale: 1.05,
                    rotate: 2,
                    transition: { duration: 0.3 }
                  }}
                />
              </motion.div>
              <motion.div
                className="md:w-1/2 text-white font-poppins-normal text-xl leading-relaxed space-y-6"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <motion.p 
                  className="text-gray-200"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  NCAHT, a joint initiative by ICMR, IIT Delhi, and AIIMS Delhi,
                  envisions a world of equal access through innovative assistive
                  technologies. We aim to empower individuals of all abilities
                  with tools that support independent and inclusive living.
                </motion.p>
                <motion.a
                  href="/about"
                  className="inline-block mt-8 text-yellow-400 hover:text-yellow-300 transition-colors text-xl font-poppins-normal hover:underline"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    x: 10,
                    transition: { duration: 0.2 }
                  }}
                >
                  Learn more →
                </motion.a>
              </motion.div>
            </div>
          </div>
        </div>
  
        {/* === Why Describe-it section === */}
        <div ref={whyDescribeItRef}>
          <motion.div 
            className="bg-gradient-to-b from-gray-800 to-gray-900 py-32"
            onViewportEnter={() => setStartCounting(true)}
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="container mx-auto px-12 max-w-7xl">
              <motion.h2 
                className="text-6xl font-poppins-bold text-center text-yellow-400 mb-24"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                Why <span className="text-white">Describe-it?</span>
              </motion.h2>
    
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 text-white text-center">
                {/* Card 1 */}
                <motion.div
                  className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-10 shadow-2xl border border-gray-700 hover:bg-gray-700/70 hover:border-yellow-400/50 transition-all duration-50"
                  whileHover={{ 
                    scale: 1.03,
                    y: -5,
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.2,
                    delay: 0,
                    ease: "easeOut"
                  }}
                  viewport={{ once: true }}
                >
                  <div className="text-5xl mb-6">🎯</div>
                  <h3 className="text-2xl font-poppins-bold text-yellow-400 mb-4">{count1}% Accuracy</h3>
                  <p className="text-lg font-poppins-normal text-gray-300">Descriptions verified for precision.</p>
                </motion.div>
    
                {/* Card 2 */}
                <motion.div
                  className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-10 shadow-2xl border border-gray-700 hover:bg-gray-700/70 hover:border-yellow-400/50 transition-all duration-50"
                  whileHover={{ 
                    scale: 1.03,
                    y: -5,
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.2,
                    delay: 0.1,
                    ease: "easeOut"
                  }}
                  viewport={{ once: true }}
                >
                  <div className="text-5xl mb-6">⚡</div>
                  <h3 className="text-2xl font-poppins-bold text-yellow-400 mb-4">&lt; {count2}s Retrieval</h3>
                  <p className="text-lg font-poppins-normal text-gray-300">Fast access to image descriptions.</p>
                </motion.div>
    
                {/* Card 3 */}
                <motion.div
                  className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-10 shadow-2xl border border-gray-700 hover:bg-gray-700/70 hover:border-yellow-400/50 transition-all duration-50"
                  whileHover={{ 
                    scale: 1.03,
                    y: -5,
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.2,
                    delay: 0.2,
                    ease: "easeOut"
                  }}
                  viewport={{ once: true }}
                >
                  <div className="text-5xl mb-6">📚</div>
                  <h3 className="text-2xl font-poppins-bold text-yellow-400 mb-4">NCERT</h3>
                  <p className="text-lg font-poppins-normal text-gray-300">Aligned with school curriculum from classes 6 to 10.</p>
                </motion.div>
    
                {/* Card 4 */}
                <motion.div
                  className="bg-gray-800/70 backdrop-blur-sm rounded-xl p-10 shadow-2xl border border-gray-700 hover:bg-gray-700/70 hover:border-yellow-400/50 transition-all duration-50"
                  whileHover={{ 
                    scale: 1.03,
                    y: -5,
                  }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.2,
                    delay: 0.3,
                    ease: "easeOut"
                  }}
                  viewport={{ once: true }}
                >
                  <div className="text-5xl mb-6">😎</div>
                  <h3 className="text-2xl font-poppins-bold text-yellow-400 mb-4">{count4}% Inclusive</h3>
                  <p className="text-lg font-poppins-normal text-gray-300">Designed with VI student feedback.</p>
                </motion.div>
              </div>
    
              {/* Ending Statement */}
              <motion.p
                className="mt-24 max-w-4xl mx-auto text-gray-200 text-2xl text-center font-poppins-normal leading-relaxed"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                viewport={{ once: true }}
              >
                Describe-it bridges the accessibility gap in education — turning
                complex visual content into inclusive, meaningful learning for all.
              </motion.p>
            </div>
          </motion.div>
        </div>
      </>
    );
}