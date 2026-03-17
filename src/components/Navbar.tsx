import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      {/* Top Bar */}
      <div className="navbar-top">
        <Link to="/" className="navbar-logo">ALOA DECOR</Link>
      </div>
      
      {/* Secondary Navigation */}
      <div className="navbar-secondary">
        <ul className="navbar-links">
          <li><Link to="/products" className="nav-link">PRODUCTS PAGES</Link></li>
          <li><Link to="/product-contents" className="nav-link">PRODUCT CONTENTS</Link></li>
          <li><Link to="/about" className="nav-link">ABOUT US</Link></li>
          <li><Link to="/contact" className="nav-link">CONTACT</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
