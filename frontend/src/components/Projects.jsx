import React from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const PrevArrow = ({ onClick }) => (
  <button 
    onClick={onClick} 
    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10 p-3 rounded-full bg-stone-800/50 hover:bg-stone-700/50 border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300"
  >
    <i className="fas fa-chevron-left text-blue-500"></i>
  </button>
);

const NextArrow = ({ onClick }) => (
  <button 
    onClick={onClick} 
    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 z-10 p-3 rounded-full bg-stone-800/50 hover:bg-stone-700/50 border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300"
  >
    <i className="fas fa-chevron-right text-blue-500"></i>
  </button>
);

const Projects = () => {
  const projects = [
    {
      title: "Arduino Bin-Picking Robot",
      description: "Developed a sophisticated robotic arm using Arduino, capable of identifying and picking objects from a bin.",
      link: "https://github.com/Fredheda/Arduino-Bin-Picking",
      categories: ["Robotics", "Arduino"],
      icon: "fa-robot"
    },
    {
      title: "Uber Rides in New York City",
      description: "An analysis of Uber rides in NYC, exploring the impact of weather and time on ride demand.",
      link: "https://github.com/Fredheda/NYC-Uber-Rides",
      categories: ["Data Science", "Python"],
      icon: "fa-chart-line"
    },
    {
      title: "Chatbot Research Assistant",
      description: "Built a chatbot that helps researchers find papers and articles on their topic of interest.",
      link: "https://github.com/Fredheda/Fredbot",
      categories: ["AI", "NLP"],
      icon: "fa-brain"
    },
    {
      title: "TFL Status Checker",
      description: "A web app that checks the status of London's public transportation (TFL) and sends notifications.",
      link: "https://github.com/Fredheda/TFL_Status",
      categories: ["Web App", "API"],
      icon: "fa-train"
    }
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        }
      }
    ],
    appendDots: dots => (
      <div className="bottom-[-40px]">
        <ul className="flex justify-center gap-2"> {dots} </ul>
      </div>
    ),
    customPaging: i => (
      <div className="w-2 h-2 rounded-full bg-blue-500/50 hover:bg-blue-500 transition-colors duration-300"></div>
    )
  };

  return (
    <section className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-12 py-8 rounded-[15px] max-w-[1200px] mx-auto mb-2.5 font-montserrat relative overflow-hidden">
      <h2 className="font-permanent-marker text-3xl text-left text-white mb-8 font-semibold flex items-center">
        <i className="fas fa-rocket mr-4 text-blue-500"></i>
        Featured Projects
      </h2>

      <div className="mt-2.5 pb-12">
        <Slider {...settings}>
          {projects.map((project, index) => (
            <div key={index} className="px-2 py-4"> {/* Added py-4 for vertical padding */}
              <div className="group bg-gradient-to-br from-blue-500/5 via-stone-800/95 to-stone-900 rounded-xl border border-blue-500/20 hover:border-blue-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] h-[400px] overflow-hidden origin-center"> {/* Added origin-center */}
                <div className="p-6 flex flex-col h-full">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl text-white font-semibold group-hover:text-blue-400 transition-colors duration-300">
                        {project.title}
                      </h3>
                      <i className={`fas ${project.icon} text-blue-500 text-xl group-hover:scale-110 transition-transform duration-300`}></i>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.categories.map((category, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm leading-relaxed flex-grow">
                    {project.description}
                  </p>

                  <div className="mt-6">
                    <a 
                      href={project.link}
                      className="inline-flex items-center text-sm text-white font-semibold py-2 px-4 rounded-lg bg-stone-800/50 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/50 transition-all duration-300"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fab fa-github mr-2"></i>
                      View Project
                      <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform duration-300"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default Projects;