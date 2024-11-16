import React from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Custom arrow components
const PrevArrow = ({ onClick }) => {
  return (
    <div className="custom-arrow custom-prev" onClick={onClick}>
      <span className="text-xl text-white">←</span>
    </div>
  );
};

const NextArrow = ({ onClick }) => {
  return (
    <div className="custom-arrow custom-next" onClick={onClick}>
      <span className="text-xl text-white">→</span>
    </div>
  );
};

const Projects = () => {
  const projects = [
    {
      title: "Arduino Bin-Picking Robot",
      description: "Developed a sophisticated robotic arm using Arduino, capable of identifying and picking objects from a bin.",
      link: "https://github.com/Fredheda/Arduino-Bin-Picking"
    },
    {
      title: "Uber Rides in New York City",
      description: "An analysis of Uber rides in NYC, exploring the impact of weather and time on ride demand.",
      link: "https://github.com/Fredheda/NYC-Uber-Rides"
    },
    {
      title: "Chatbot Research Assistant",
      description: "Built a chatbot that helps researchers find papers and articles on their topic of interest.",
      link: "https://github.com/Fredheda/Fredbot"
    },
    {
      title: "TFL Status Checker",
      description: "A web app that checks the status of London's public transportation (TFL) and sends notifications.",
      link: "https://github.com/Fredheda/TFL_Status"
    }
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3, // Show 3 cards at a time
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
          slidesToShow: 2, // Show 2 cards at a time on smaller screens
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1, // Show 1 card at a time on mobile
        }
      }
    ]
  };

  return (
    <section id="projects" className="bg-gray-100 px-16 pt-2.5 pb-2.5 rounded-[15px] max-w-[1200px] mx-auto my-1 text-center overflow-hidden font-montserrat">
      <h2 className="font-permanent-marker text-2xl text-left text-black mb-2.5 font-semibold -ml-11">My Projects</h2>
      <Slider {...settings}>
        {projects.map((project, index) => (
          <div className="bg-white rounded-[15px] shadow-lg overflow-hidden p-2.5 h-[400px] w-[300px] transition-transform duration-300 ease-in-out cursor-pointer mx-auto hover:transform hover:-translate-y-1 hover:shadow-2xl" key={index}>
            <div className="p-3 text-left">
              <h3 className="text-lg text-black mb-2 font-semibold">{project.title}</h3>
              <p className="text-sm text-black-950 leading-6 mb-3">{project.description}</p>
              <a href={project.link} className="inline-block text-black-950 font-semibold no-underline border-2 border-black py-2 px-4 rounded-full transition-colors duration-300 ease-in-out hover:bg-purple-950 hover:text-white" target="_blank" rel="noopener noreferrer">Learn More</a>
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
};

export default Projects;