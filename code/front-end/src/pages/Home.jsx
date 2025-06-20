import React from "react";
import "../assets/style/main.css";
import video from "../assets/hero.webm";
import RotatingText from "../components/RotatingText";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Marquee from "react-fast-marquee";
import ScrollEffect from "../components/ScrollEffect";
import ScrollOpacity from "../components/ScrollOpacity";
export default function Home() {
  return (
    <div>   
      <div className="relative overflow-x-hidden pt-5 h-screen">
        <div className="relative w-[80%] mx-auto px-4">
          {/* Header */}
          <Navbar />

          {/* Main Content */}
          <main className="gap-4 pt-6">
            {/* Main Heading */}
            <div className="col-span-12 relative">
              <h1 className="text-[#2b2b2b] text-[7rem] font-medium leading-tight">
                <span className="inline-flex">
                  AI-Driven Data Warehousing
                </span>
                <span className="relative flex items-center gap-10">
                  <span className="">
                    Digital Frontiers
                  </span>
                  <span className="">
                    <video className="w-[200px] h-[100px] rounded-full object-cover scale-[1.025]" src={video} autoPlay loop type="video/mp4">
                    </video>
                  </span>
                </span>
              </h1>
              <h2 className="text-[#4361ee] text-[7rem] font-medium mt-4 flex">
                Data
                <RotatingText
                  texts={[' Warehouse', ' Schema', ' Manipulation']}
                  mainClassName=""
                  staggerFrom={"last"}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "-120%" }}
                  staggerDuration={0.025}
                  splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                  transition={{ type: "spring", damping: 30, stiffness: 400 }}
                  rotationInterval={2000}
                />
              </h2>

              {/* Purple 3D shape */}
              <div className="absolute right-40 bottom-20">
                <div className="w-24 h-24 bg-[#d7d1ff] rounded-full opacity-80 blur-sm"></div>
              </div>
            </div>

            {/* Footer Content */}
            <div className="col-span-12 mt-14 grid grid-cols-12 gap-4">
              <div className="col-span-2 text-[1rem] flex items-center">
                <p className="text-[#2b2b2b] font-semibold"> <span className="font-bold">W.</span> Digital Thinkers 
                </p>
              </div>

              <div className="col-span-4 flex items-center">
                <button className="herobtn w-full bg-[#4361ee] text-white py-6 rounded-md flex items-center overflow-hidden justify-center gap-2 font-medium relative">
                  <Link to="/upload" className="w-full h-full flex items-center justify-center gap-2">
                    <div className="herooverlay bg-[#292929] w-full h-full absolute rounded-md left-[-100%]"></div>
                    <svg className="h-6 w-6 btnSvg absolute left-3 z-[10]" fill="none" viewBox="0 0 19 32"><circle cx="15.584" cy="16.061" r="2.27" fill="#fff" transform="rotate(135 15.584 16.06)"></circle><circle cx="9.805" cy="21.84" r="2.27" fill="#fff" transform="rotate(135 9.805 21.84)"></circle><circle cx="3.21" cy="28.435" r="2.27" fill="#fff" transform="rotate(135 3.21 28.435)"></circle><circle cx="9.806" cy="9.805" r="2.27" fill="#fff" transform="rotate(-135 9.806 9.805)"></circle><circle cx="3.211" cy="3.21" r="2.27" fill="#fff" transform="rotate(-135 3.21 3.21)"></circle></svg>
                    <svg className="h-6 w-6 btnSvg absolute left-9 z-[10]" fill="none" viewBox="0 0 19 32"><circle cx="15.584" cy="16.061" r="2.27" fill="#fff" transform="rotate(135 15.584 16.06)"></circle><circle cx="9.805" cy="21.84" r="2.27" fill="#fff" transform="rotate(135 9.805 21.84)"></circle><circle cx="3.21" cy="28.435" r="2.27" fill="#fff" transform="rotate(135 3.21 28.435)"></circle><circle cx="9.806" cy="9.805" r="2.27" fill="#fff" transform="rotate(-135 9.806 9.805)"></circle><circle cx="3.211" cy="3.21" r="2.27" fill="#fff" transform="rotate(-135 3.21 3.21)"></circle></svg>
                    <svg className="h-6 w-6 btnSvg absolute left-14 z-[10]" fill="none" viewBox="0 0 19 32"><circle cx="15.584" cy="16.061" r="2.27" fill="#fff" transform="rotate(135 15.584 16.06)"></circle><circle cx="9.805" cy="21.84" r="2.27" fill="#fff" transform="rotate(135 9.805 21.84)"></circle><circle cx="3.21" cy="28.435" r="2.27" fill="#fff" transform="rotate(135 3.21 28.435)"></circle><circle cx="9.806" cy="9.805" r="2.27" fill="#fff" transform="rotate(-135 9.806 9.805)"></circle><circle cx="3.211" cy="3.21" r="2.27" fill="#fff" transform="rotate(-135 3.21 3.21)"></circle></svg>
                    <span className="heroBtnText z-10 text-xl font-semibold flex items-center gap-2"> 
                      Try Now <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 8 11"><circle cx="2.429" cy="2.358" r="1.111" fill="#fff" transform="rotate(45 2.429 2.358)"></circle><circle cx="5.571" cy="5.5" r="1.111" fill="#fff" transform="rotate(135 5.571 5.5)"></circle><circle cx="2.429" cy="8.642" r="1.111" fill="#fff" transform="rotate(135 2.429 8.642)"></circle></svg>
                    </span>
                  </Link>
                </button>
              </div>
              <div className="col-span-2 col-start-10">
                <div className="flex items-start gap-2">
                  <span className="text-[#4361ee] text-xl">*</span>
                  <p className="text-[#2b2b2b] text-sm leading-relaxed">
                    Talks, networking, activities, and parties. Learn from global influential leaders, connect with
                    like-minded peers, and shape the future of the digital industry.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      <ScrollOpacity />
        <div className="p-5 bg-[#4361ee] text-white mt-10 absolute bottom-0 w-full overflow-hidden">
        <Marquee speed={40} gradient={false}>
          <div className="flex items-center gap-6">
            {[
              "AI-Driven Data Warehousing",
              "Cloud-Native Data Warehousing",
              "Automated Data Warehousing",
              "Real-Time Data Warehousing",
              "Big Data Warehousing Solutions",
              "Modern Data Warehousing Architecture",
              "Data Lake Integration",
              "Scalable Data Warehousing",
              "Next-Gen Data Warehousing",
              "Self-Service Data Warehousing",
              "Predictive Analytics in Data Warehousing",
              "Data Warehouse Optimization",
              "Hybrid Data Warehousing",
              "Data Warehousing and Business Intelligence",
              "ETL-Driven Data Warehousing",
              "Cloud-Based Data Warehouse Platforms",
              "Machine Learning in Data Warehousing",
              "Edge Computing and Data Warehousing",
              "Automated ETL for Data Warehousing",
              "High-Performance Data Warehousing",
              "Data Governance in Warehousing"
            ].map((text, index) => (
              <div key={index} className="flex items-center justify-center">
                <div className="h-2 w-2 bg-white  rounded-full mb-[1.5px]"></div>
                <span className="text-[1rem] font-semibold px-1 whitespace-nowrap">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </Marquee>
      </div>
      </div>
    </div>
  );
}