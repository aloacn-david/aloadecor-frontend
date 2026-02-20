import React, { useState, useEffect } from 'react';
import { ShopifyService } from '../services/shopify';
import { ShopifyProduct } from '../types/shopify';

const EnhancedProductList: React.FC = () => {
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
    return <div>Loading products...</div>;
  }

  return (
    <div className="product-list">
      <h1>Our Products</h1>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search by product name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="products-grid">
        {filteredProducts.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image-container">
              {product.images.length > 0 && (
                <img 
                  src={product.images[0].src} 
                  alt={product.title} 
                  className="product-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://placehold.co/300x300?text=Product+Image';
                  }}
                />
              )}
            </div>
            <div className="product-info">
              <h3 className="product-title">{product.title}</h3>
              
              {/* Display SKU if available */}
              {product.variants && product.variants.length > 0 && product.variants[0].sku && (
                <p className="product-sku"><strong>SKU:</strong> {product.variants[0].sku}</p>
              )}
              
              <p className="product-description">{product.description}</p>
              <div className="platform-links">
                <h4 className="platform-links-title">Shop on:</h4>
                <div className="platform-buttons">
                  {product.platformLinks.amazon1 && (
                    <a href={product.platformLinks.amazon1} target="_blank" rel="noopener noreferrer" className="platform-button amazon">
                      Amazon 1
                    </a>
                  )}
                  {product.platformLinks.amazon2 && (
                    <a href={product.platformLinks.amazon2} target="_blank" rel="noopener noreferrer" className="platform-button amazon">
                      Amazon 2
                    </a>
                  )}
                  {product.platformLinks.wf1 && (
                    <a href={product.platformLinks.wf1} target="_blank" rel="noopener noreferrer" className="platform-button wayfair">
                      WF 1
                    </a>
                  )}
                  {product.platformLinks.wf2 && (
                    <a href={product.platformLinks.wf2} target="_blank" rel="noopener noreferrer" className="platform-button wayfair">
                      WF 2
                    </a>
                  )}
                  {product.platformLinks.os1 && (
                    <a href={product.platformLinks.os1} target="_blank" rel="noopener noreferrer" className="platform-button overstock">
                      OS 1
                    </a>
                  )}
                  {product.platformLinks.os2 && (
                    <a href={product.platformLinks.os2} target="_blank" rel="noopener noreferrer" className="platform-button overstock">
                      OS 2
                    </a>
                  )}
                  {product.platformLinks.hd1 && (
                    <a href={product.platformLinks.hd1} target="_blank" rel="noopener noreferrer" className="platform-button homedepot">
                      HD 1
                    </a>
                  )}
                  {product.platformLinks.hd2 && (
                    <a href={product.platformLinks.hd2} target="_blank" rel="noopener noreferrer" className="platform-button homedepot">
                      HD 2
                    </a>
                  )}
                  {product.platformLinks.lowes && (
                    <a href={product.platformLinks.lowes} target="_blank" rel="noopener noreferrer" className="platform-button lowes">
                      Lowe's
                    </a>
                  )}
                  {product.platformLinks.target && (
                    <a href={product.platformLinks.target} target="_blank" rel="noopener noreferrer" className="platform-button target">
                      Target
                    </a>
                  )}
                  {product.platformLinks.walmart && (
                    <a href={product.platformLinks.walmart} target="_blank" rel="noopener noreferrer" className="platform-button walmart">
                      Walmart
                    </a>
                  )}
                  {product.platformLinks.ebay && (
                    <a href={product.platformLinks.ebay} target="_blank" rel="noopener noreferrer" className="platform-button ebay">
                      Ebay
                    </a>
                  )}
                  {product.platformLinks.kohls && (
                    <a href={product.platformLinks.kohls} target="_blank" rel="noopener noreferrer" className="platform-button kohls">
                      Kohl's
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnhancedProductList;