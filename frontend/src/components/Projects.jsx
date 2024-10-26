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
      link: "#"
    },
    {
      image: "/images/project2.jpg",
      title: "Autonomous Car Simulation",
      description: "Designed a simulation of an autonomous vehicle using Python, capable of navigating complex paths and obstacles.",
      link: "#"
    },
    {
      image: "/images/project3.jpg",
      title: "Smart Home Automation",
      description: "Built a smart home system that automates lighting, temperature, and security using IoT devices.",
      link: "#"
    },
    {
      image: "/images/project4.jpg",
      title: "Machine Learning Stock Predictor",
      description: "Created a machine learning model that analyzes historical stock data to predict future trends.",
      link: "#"
    },
    {
      image: "/images/project5.jpg",
      title: "Drone Delivery System",
      description: "Developed a drone-based system for autonomous package delivery using GPS and image recognition.",
      link: "#"
    },
    {
      image: "/images/project6.jpg",
      title: "Real-Time Traffic Monitoring",
      description: "Implemented a traffic monitoring system using cameras and machine learning to detect and analyze road conditions.",
      link: "#"
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
    <section className="projects-section">
      <h2 className="projects-title">My Projects</h2>
      <Slider {...settings}>
        {projects.map((project, index) => (
          <div className="project-card" key={index}>
            <img src={project.image} alt={project.title} className="project-image" />
            <div className="project-details">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <a href={project.link} className="project-link">Learn More</a>
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
};

export default Projects;