import React, { useState, useEffect } from 'react';
import { ShopifyService } from '../services/shopify';
import { ShopifyProduct } from '../types/shopify';
import { getAllPlatformLinks } from '../services/platformLinks';
import './CategorizedProductList.css';

// Platform configuration - all available platforms with brand colors
const PLATFORMS = [
  { key: 'amazon1', label: 'Amazon 1', colorClass: 'amazon' },
  { key: 'amazon2', label: 'Amazon 2', colorClass: 'amazon' },
  { key: 'wf1', label: 'WF 1', colorClass: 'wayfair' },
  { key: 'wf2', label: 'WF 2', colorClass: 'wayfair' },
  { key: 'os1', label: 'OS 1', colorClass: 'overstock' },
  { key: 'os2', label: 'OS 2', colorClass: 'overstock' },
  { key: 'hd1', label: 'HD 1', colorClass: 'homedepot' },
  { key: 'hd2', label: 'HD 2', colorClass: 'homedepot' },
  { key: 'lowes', label: "Lowe's", colorClass: 'lowes' },
  { key: 'target', label: 'Target', colorClass: 'target' },
  { key: 'walmart', label: 'Walmart', colorClass: 'walmart' },
  { key: 'ebay', label: 'Ebay', colorClass: 'ebay' },
  { key: 'kohls', label: "Kohl's", colorClass: 'kohls' },
] as const;

const CategorizedProductList: React.FC = () => {
  console.log('[DEBUG] CategorizedProductList component mounted');
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopifyProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const shopifyService = new ShopifyService();
        const [products, platformLinksData] = await Promise.all([
          shopifyService.fetchProducts(),
          getAllPlatformLinks()
        ]);
        
        console.log('[DEBUG] Shopify products received:', products.length);
        console.log('[DEBUG] Platform links data received:', Object.keys(platformLinksData).length, 'products');
        
        // Merge products with platform links from backend
        // Convert product.id to string to match platformLinksData keys
        const productsWithLinks = products.map(product => {
          const productIdStr = String(product.id);
          
          // Use platformLinks from product data first (already merged by backend)
          // Only use platformLinksData if product doesn't have platformLinks
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
          
          // Debug: log all products with their links
          console.log('[DEBUG] Product:', product.id, product.title);
          console.log('[DEBUG] Platform links:', links);
          console.log('[DEBUG] Has Amazon 1:', !!links.amazon1, links.amazon1);
          console.log('[DEBUG] Has Amazon 2:', !!links.amazon2, links.amazon2);
          console.log('[DEBUG] Has WF 1:', !!links.wf1, links.wf1);
          console.log('[DEBUG] Has WF 2:', !!links.wf2, links.wf2);
          
          // Debug info for first product with links
          if (Object.values(links).some(link => link !== '') && !debugInfo) {
            setDebugInfo(`Product ID: ${product.id}\nPlatform Links: ${JSON.stringify(links, null, 2)}`);
          }
          
          return {
            ...product,
            platformLinks: links
          };
        });
        
        setProducts(productsWithLinks);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(productsWithLinks.map(p => p.category))];
        setCategories(['All', ...uniqueCategories.sort()]);
        
        setFilteredProducts(productsWithLinks);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    let result = products;
    
    // Apply category filter
    if (selectedCategory !== 'All') {
      result = result.filter(product => product.category === selectedCategory);
    }
    
    // Apply search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(product => 
        product.title.toLowerCase().includes(term) ||
        product.variants.some(variant => variant.sku && variant.sku.toLowerCase().includes(term)) ||
        product.category.toLowerCase().includes(term)
      );
    }
    
    setFilteredProducts(result);
  }, [selectedCategory, searchTerm, products]);

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="product-list-container">
      {/* Version Info */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: '#ffeb3b',
        border: '2px solid #f57f17',
        padding: '8px 12px',
        borderRadius: '5px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 9999,
        color: '#333'
      }}>
        v2026.02.21-13PLATFORMS
      </div>
      
      {/* Debug Panel */}
      {debugInfo && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: '#f5f5f5',
          border: '2px solid #333',
          padding: '10px',
          borderRadius: '5px',
          maxWidth: '400px',
          maxHeight: '300px',
          overflow: 'auto',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 9999,
          whiteSpace: 'pre-wrap'
        }}>
          <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Debug Info:</div>
          {debugInfo}
          <button 
            onClick={() => setDebugInfo('')}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              background: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      )}
      
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>Home</span>
        <span className="separator">›</span>
        <span>Products</span>
        {selectedCategory !== 'All' && (
          <>
            <span className="separator">›</span>
            <span>{selectedCategory}</span>
          </>
        )}
        <span className="item-count">{filteredProducts.length} items</span>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by product name, SKU, or category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Category Pills */}
      <div className="category-pills">
        {categories.map(category => (
          <button
            key={category}
            className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="product-grid">
        {filteredProducts.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image-wrapper">
              <img
                src={product.images[0]?.src || '/placeholder.png'}
                alt={product.title}
                className="product-image"
                loading="lazy"
                onError={(e) => { 
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.png'; 
                }}
              />
            </div>
            <div className="product-info">
              <h3 className="product-title">{product.title}</h3>
              {product.variants && product.variants.length > 0 && product.variants[0].sku && (
                <p className="product-sku">SKU: {product.variants[0].sku}</p>
              )}
              <div className="platform-links">
                {PLATFORMS.map((platform) => {
                  const link = product.platformLinks?.[platform.key as keyof typeof product.platformLinks];
                  const hasLink = link && link.trim() !== '';
                  
                  return hasLink ? (
                    <a 
                      key={platform.key}
                      href={link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={`platform-link active ${platform.colorClass}`}
                    >
                      {platform.label}
                    </a>
                  ) : (
                    <span key={platform.key} className={`platform-link inactive ${platform.colorClass}`}>
                      {platform.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategorizedProductList;
