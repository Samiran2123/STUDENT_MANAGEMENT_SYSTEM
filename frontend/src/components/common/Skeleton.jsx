import React from 'react';

const Skeleton = ({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', count = 1 }) => {
  const style = {
    width,
    height,
    borderRadius,
    background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite linear',
    marginBottom: count > 1 ? '0.75rem' : '0',
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} style={style} />
      ))}
    </>
  );
};

export default Skeleton;
