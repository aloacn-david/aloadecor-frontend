import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      {/* Top Bar */}
      <div className="navbar-top">
        <Link to="/" className="navbar-logo">ALOA DECOR</Link>
        
        <div className="navbar-actions">
          <Link to="/account" className="action-link">Account</Link>
          <Link to="/favorites" className="action-link">Favorites</Link>
          <Link to="/cart" className="action-link">Cart</Link>
        </div>
      </div>
      
      {/* Secondary Navigation */}
      <div className="navbar-secondary">
        <ul className="navbar-links">
          <li><Link to="/products" className="nav-link">Products</Link></li>
          <li><Link to="/categories" className="nav-link">Categories</Link></li>
          <li><Link to="/about" className="nav-link">About Us</Link></li>
          <li><Link to="/contact" className="nav-link">Contact</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
