import React, { useState, useEffect } from 'react';
import { ShopifyService } from '../services/shopify';
import { ShopifyProduct } from '../types/shopify';

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      console.log('[ProductList] Fetching products...');
      const shopifyService = new ShopifyService();
      const products = await shopifyService.fetchProducts();
      console.log('[ProductList] Received products:', products);
      console.log('[ProductList] Products count:', products.length);
      setProducts(products);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div className="product-list">
      <h1>Our Products</h1>
      <div className="products-grid">
        {products.map((product) => (
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

export default ProductList;
