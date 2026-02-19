import React, { useState, useEffect } from 'react';
import { ShopifyService } from '../services/shopify';
import { ShopifyProduct } from '../types/shopify';
import { getAllPlatformLinks } from '../services/platformLinks';
import './CategorizedProductList.css';

// Platform configuration - all available platforms with brand colors
const PLATFORMS = [
  { key: 'wayfair', label: 'Wayfair', colorClass: 'wayfair' },
  { key: 'amazon', label: 'Amazon', colorClass: 'amazon' },
  { key: 'overstock', label: 'Overstock', colorClass: 'overstock' },
  { key: 'homeDepot', label: 'Home Depot', colorClass: 'homedepot' },
  { key: 'lowes', label: "Lowe's", colorClass: 'lowes' },
  { key: 'target', label: 'Target', colorClass: 'target' },
  { key: 'kohls', label: "Kohl's", colorClass: 'kohls' },
] as const;

const CategorizedProductList: React.FC = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopifyProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const shopifyService = new ShopifyService();
        const [products, platformLinksData] = await Promise.all([
          shopifyService.fetchProducts(),
          getAllPlatformLinks()
        ]);
        
        // Merge products with platform links from backend
        const productsWithLinks = products.map(product => ({
          ...product,
          platformLinks: platformLinksData[product.id] || {
            wayfair: '',
            amazon: '',
            overstock: '',
            homeDepot: '',
            lowes: '',
            target: '',
            kohls: ''
          }
        }));
        
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
