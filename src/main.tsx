import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles.css';
import ProductList from './components/CategorizedProductList';
import AdminPanel from './components/AdminPanel';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'products' | 'admin'>('products');

  return (
    <div className="app">
      <Navbar />
      <Hero />
      <div className="view-toggle">
        <button 
          className={`view-button ${currentView === 'products' ? 'active' : ''}`}
          onClick={() => setCurrentView('products')}
        >
          View Products
        </button>
        <button 
          className={`view-button ${currentView === 'admin' ? 'active' : ''}`}
          onClick={() => setCurrentView('admin')}
        >
          Admin Panel
        </button>
      </div>
      {currentView === 'products' ? <ProductList /> : <AdminPanel />}
      <Footer />
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);