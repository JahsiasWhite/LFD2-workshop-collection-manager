import React, { useState, useEffect, useRef } from 'react';

const LazyImage = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const imageElement = rootRef.current;
    if (!imageElement) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(imageElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className={`lazy-image ${className || ''}`}>
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
