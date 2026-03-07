import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles.css';
import ProductList from './components/CategorizedProductList';
import AdminPanel from './components/AdminPanel';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import { ShopifyProduct } from './types/shopify';
import { ShopifyService } from './services/shopify';
import { getAllPlatformLinks } from './services/platformLinks';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'products' | 'admin'>('products');
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 加载产品和平台链接数据
  const loadProducts = async () => {
    try {
      const shopifyService = new ShopifyService();
      const [products, platformLinksData] = await Promise.all([
        shopifyService.fetchProducts(),
        getAllPlatformLinks()
      ]);
      
      // 合并产品与平台链接
      const productsWithLinks = products.map(product => {
        const productIdStr = String(product.id);
        const links = product.platformLinks || platformLinksData[productIdStr] || {
          amazon1: '',
          amazon2: '',
          wf1: '',
          wf2: '',
          os1: '',
          os2: '',
          hd1: '',
          hd2: '',
          lowes: '',
          target: '',
          walmart: '',
          ebay: '',
          kohls: ''
        };
        return {
          ...product,
          platformLinks: links
        };
      });
      
      setProducts(productsWithLinks);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  // 初始加载数据
  useEffect(() => {
    loadProducts();
  }, []);

  // 处理切换到产品页面
  const handleViewProducts = async () => {
    setCurrentView('products');
    // 切换到产品页面时重新加载数据
    await loadProducts();
  };

  return (
    <div className="app">
      <Navbar />
      <Hero />
      <div className="view-toggle">
        <button 
          className={`view-button ${currentView === 'products' ? 'active' : ''}`}
          onClick={handleViewProducts}
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
      {currentView === 'products' ? 
        <ProductList products={products} onRefresh={loadProducts} /> : 
        <AdminPanel onLinksUpdated={loadProducts} />}
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
// Debug timestamp: Fri Feb 20 15:51:27 CST 2026
console.log('Debug: Platform links loaded successfully');

