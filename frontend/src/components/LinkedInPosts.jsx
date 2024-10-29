import React from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './LinkedInPosts.css';

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

const LinkedInPostsCarousel = () => {
  const posts = [
    {
      src: "https://www.linkedin.com/embed/feed/update/urn:li:share:7254250577092644864",
      title: "LinkedIn Post 1"
    },
    {
      src: "https://www.linkedin.com/embed/feed/update/urn:li:share:7254250577092644864",
      title: "LinkedIn Post 2"
    },
    {
      src: "https://www.linkedin.com/embed/feed/update/urn:li:share:7254250577092644864",
      title: "LinkedIn Post 3"
    },
    // Add more posts as needed
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 2, // Show 2 slides at a time
    slidesToScroll: 1, // Scroll 1 slide at a time
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />
  };

  return (
    <div className="linkedin-posts-carousel">
      <Slider {...settings}>
        {posts.map((post, index) => (
          <div key={index} className="linkedin-post">
            <iframe 
              src={post.src} 
              frameBorder="0" 
              allowFullScreen="" 
              title={post.title}
              className="linkedin-iframe"
            ></iframe>
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default LinkedInPostsCarousel;