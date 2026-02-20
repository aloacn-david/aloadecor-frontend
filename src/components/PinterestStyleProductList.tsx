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
                  {product.platformLinks.amazon1 && (
                    <a 
                      href={product.platformLinks.amazon1} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge amazon">Amazon 1</div>
                    </a>
                  )}
                  {product.platformLinks.amazon2 && (
                    <a 
                      href={product.platformLinks.amazon2} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge amazon">Amazon 2</div>
                    </a>
                  )}
                  {product.platformLinks.wf1 && (
                    <a 
                      href={product.platformLinks.wf1} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge wayfair">WF 1</div>
                    </a>
                  )}
                  {product.platformLinks.wf2 && (
                    <a 
                      href={product.platformLinks.wf2} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge wayfair">WF 2</div>
                    </a>
                  )}
                  {product.platformLinks.os1 && (
                    <a 
                      href={product.platformLinks.os1} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge overstock">OS 1</div>
                    </a>
                  )}
                  {product.platformLinks.os2 && (
                    <a 
                      href={product.platformLinks.os2} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge overstock">OS 2</div>
                    </a>
                  )}
                  {product.platformLinks.hd1 && (
                    <a 
                      href={product.platformLinks.hd1} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge homedepot">HD 1</div>
                    </a>
                  )}
                  {product.platformLinks.hd2 && (
                    <a 
                      href={product.platformLinks.hd2} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge homedepot">HD 2</div>
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
                  {product.platformLinks.walmart && (
                    <a 
                      href={product.platformLinks.walmart} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge walmart">Walmart</div>
                    </a>
                  )}
                  {product.platformLinks.ebay && (
                    <a 
                      href={product.platformLinks.ebay} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="platform-link"
                    >
                      <div className="platform-badge ebay">Ebay</div>
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