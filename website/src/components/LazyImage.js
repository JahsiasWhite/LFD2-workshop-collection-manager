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
    <div id={`lazy-image-${alt}`} className={`lazy-image ${className || ''}`}>
      {(!isInView || !isLoaded) && <div className="lazy-image-placeholder" />}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`${className || ''} ${isLoaded ? 'is-loaded' : 'is-loading'}`}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  );
};

export default LazyImage;
