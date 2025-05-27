import React, { useState, useEffect } from 'react';

const LazyImage = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const imageElement = document.getElementById(`lazy-image-${alt}`);
    if (imageElement) {
      observer.observe(imageElement);
    }

    return () => {
      observer.disconnect();
    };
  }, [alt]);

  return (
    <div id={`lazy-image-${alt}`} className={`relative ${className}`}>
      {(!isInView || !isLoaded) && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {isInView && (
        <img
          // src={src}
          alt={alt}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
};

export default LazyImage;
