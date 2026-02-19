import React, { useState, useEffect } from 'react';
import { ShopifyService } from '../services/shopify';
import { ShopifyProduct } from '../types/shopify';

const PinterestStyleProductList: React.FC = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      const shopifyService = new ShopifyService();
      const products = await shopifyService.fetchProducts();
      setProducts(products);
      setFilteredProducts(products);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = products.filter(product => 
        product.title.toLowerCase().includes(term) ||
        product.variants.some(variant => variant.sku && variant.sku.toLowerCase().includes(term))
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="pinterest-product-list">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by product name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="pinterest-grid">
        {filteredProducts.map((product) => (
          <div key={product.id} className="pinterest-card">
            <div className="product-header">
              <h3 className="product-title">{product.title}</h3>
              {product.variants && product.variants.length > 0 && product.variants[0].sku && (
                <span className="product-sku">SKU: {product.variants[0].sku}</span>
              )}
            </div>
            
            <div className="product-content">
              <div className="product-image-wrapper">
                {product.images.length > 0 && (
                  <img 
                    src={product.images[0].src} 
                    alt={product.title} 
                    className="product-image"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/400x400?text=Product+Image';
                    }}
                  />
                )}
              </div>
              
              <div className="platform-links-section">
                <h4 className="links-title">Available on:</h4>
                <div className="platform-links-grid">
                  {product.platformLinks.wayfair && (
                    <a 
                      href={product.platformLinks.wayfair} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge wayfair">Wayfair</div>
                    </a>
                  )}
                  {product.platformLinks.amazon && (
                    <a 
                      href={product.platformLinks.amazon} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge amazon">Amazon</div>
                    </a>
                  )}
                  {product.platformLinks.overstock && (
                    <a 
                      href={product.platformLinks.overstock} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge overstock">Overstock</div>
                    </a>
                  )}
                  {product.platformLinks.homeDepot && (
                    <a 
                      href={product.platformLinks.homeDepot} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge homedepot">Home Depot</div>
                    </a>
                  )}
                  {product.platformLinks.lowes && (
                    <a 
                      href={product.platformLinks.lowes} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge lowes">Lowe's</div>
                    </a>
                  )}
                  {product.platformLinks.target && (
                    <a 
                      href={product.platformLinks.target} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge target">Target</div>
                    </a>
                  )}
                  {product.platformLinks.kohls && (
                    <a 
                      href={product.platformLinks.kohls} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge kohls">Kohl's</div>
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            <div className="product-description">
              <p>{product.description.substring(0, 100)}{product.description.length > 100 ? '...' : ''}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PinterestStyleProductList;