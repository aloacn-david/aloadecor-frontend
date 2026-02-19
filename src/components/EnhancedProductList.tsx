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
                  {product.platformLinks.wayfair && (
                    <a href={product.platformLinks.wayfair} target="_blank" rel="noopener noreferrer" className="platform-button wayfair">
                      Wayfair
                    </a>
                  )}
                  {product.platformLinks.amazon && (
                    <a href={product.platformLinks.amazon} target="_blank" rel="noopener noreferrer" className="platform-button amazon">
                      Amazon
                    </a>
                  )}
                  {product.platformLinks.overstock && (
                    <a href={product.platformLinks.overstock} target="_blank" rel="noopener noreferrer" className="platform-button overstock">
                      Overstock
                    </a>
                  )}
                  {product.platformLinks.homeDepot && (
                    <a href={product.platformLinks.homeDepot} target="_blank" rel="noopener noreferrer" className="platform-button homedepot">
                      Home Depot
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