import React from 'react';

const Hero: React.FC = () => {
  const handleViewProducts = () => {
    window.location.href = '/#products';
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">Transform Your Space</h1>
        <p className="hero-subtitle">Discover Premium Lighting & Home Decor</p>
        <button className="hero-button" onClick={handleViewProducts}>View Products</button>
      </div>
    </section>
  );
};

export default Hero;