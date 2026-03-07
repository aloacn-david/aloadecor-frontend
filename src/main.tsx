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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'products' | 'admin'>('products');
  const [products, setProducts] = useState<ShopifyProduct[]>([]);

  // 加载产品和平台链接数据
  const loadProducts = async () => {
    try {
      const shopifyService = new ShopifyService();
      const products = await shopifyService.fetchProducts();
      
      console.log('[loadProducts] Fetched products:', products.length);
      
      // 检查有活跃链接的产品数量
      const productsWithActiveLinks = products.filter(p => 
        Object.values(p.platformLinks || {}).some(link => link && link.trim() !== '')
      );
      console.log('[loadProducts]', productsWithActiveLinks.length, 'products have active links');
      
      // 打印第一个产品的平台链接数据
      if (products.length > 0) {
        console.log('[loadProducts] First product platform links:', products[0].platformLinks);
      }
      
      setProducts(products);
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

