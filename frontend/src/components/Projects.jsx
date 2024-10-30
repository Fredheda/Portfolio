import React from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './projects.css';

// Custom arrow components
const PrevArrow = ({ className, onClick }) => {
    return (
        <div className={className} onClick={onClick}>
            <span className="custom-arrow">←</span>
        </div>
    );
};

const NextArrow = ({ className, onClick }) => {
    return (
        <div className={className} onClick={onClick}>
            <span className="custom-arrow">→</span>
        </div>
    );
};

const Projects = () => {
  const projects = [
    {
      image: "/images/arduino-robot.jpg",
      title: "Arduino Bin-Picking Robot",
      description: "Developed a sophisticated robotic arm using Arduino, capable of identifying and picking objects from a bin.",
      link: "https://github.com/Fredheda/Arduino-Bin-Picking"
    },
    {
      image: "/images/project2.jpg",
      title: "Uber Rides in New York City",
      description: "An analysis of Uber rides in NYC, exploring the impact of weather and time on ride demand.",
      link: "https://github.com/Fredheda/NYC-Uber-Rides"
    },
    {
      image: "/images/project3.jpg",
      title: "Chatbot Research Assistant",
      description: "Built a chatbot that helps researchers find papers and articles on their topic of interest.",
      link: "https://github.com/Fredheda/Fredbot"
    },
    {
      image: "/images/project4.jpg",
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
    <section id="projects" className="projects-section">
      <h2 className="projects-title">My Projects</h2>
      <Slider {...settings}>
        {projects.map((project, index) => (
          <div className="project-card" key={index}>
            <div className="project-details">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <a href={project.link} className="project-link" target="_blank" rel="noopener noreferrer"> Learn More</a>
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
};

export default Projects;