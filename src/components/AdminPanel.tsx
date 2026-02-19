import React, { useState, useEffect } from 'react';
import { ShopifyService } from '../services/shopify';
import { ShopifyProduct, PlatformLinks } from '../types/shopify';
import { 
  getAllPlatformLinks, 
  updateProductPlatformLinks, 
  bulkUpdatePlatformLinks 
} from '../services/platformLinks';
import './AdminPanel.css';

// Platform configuration
const PLATFORMS = [
  { key: 'wayfair', label: 'Wayfair' },
  { key: 'amazon', label: 'Amazon' },
  { key: 'overstock', label: 'Overstock' },
  { key: 'homeDepot', label: 'Home Depot' },
  { key: 'lowes', label: "Lowe's" },
  { key: 'target', label: 'Target' },
  { key: 'kohls', label: "Kohl's" },
] as const;

const AdminPanel: React.FC = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopifyProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<ShopifyProduct | null>(null);
  const [platformLinks, setPlatformLinks] = useState<PlatformLinks>({
    wayfair: '',
    amazon: '',
    overstock: '',
    homeDepot: '',
    lowes: '',
    target: '',
    kohls: ''
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'bulk'>('list');
  const [csvData, setCsvData] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock admin credentials - in a real app, this would be handled securely
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: '2026'
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadProductsAndLinks();
    }
  }, [isLoggedIn]);

  // Load products and platform links from backend
  const loadProductsAndLinks = async () => {
    setIsLoading(true);
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
      setFilteredProducts(productsWithLinks);
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Failed to load products. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setPassword('');
    setEditingProduct(null);
  };

  const handleEditClick = (product: ShopifyProduct) => {
    setEditingProduct(product);
    setPlatformLinks({
      wayfair: product.platformLinks?.wayfair || '',
      amazon: product.platformLinks?.amazon || '',
      overstock: product.platformLinks?.overstock || '',
      homeDepot: product.platformLinks?.homeDepot || '',
      lowes: product.platformLinks?.lowes || '',
      target: product.platformLinks?.target || '',
      kohls: product.platformLinks?.kohls || '',
    });
  };

  const handleSaveLinks = async () => {
    if (!editingProduct) return;

    setIsLoading(true);
    try {
      // Save to backend API
      const success = await updateProductPlatformLinks(editingProduct.id, platformLinks);
      
      if (success) {
        // Update local state
        const updatedProducts = products.map(product => 
          product.id === editingProduct.id 
            ? { ...product, platformLinks: { ...platformLinks } } 
            : product
        );

        setProducts(updatedProducts);
        setFilteredProducts(updatedProducts);
        setEditingProduct(null);
        alert('Links updated successfully!');
      } else {
        alert('Failed to save links. Please try again.');
      }
    } catch (error) {
      console.error('Error saving links:', error);
      alert('Error saving links. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  // Handle CSV/Excel bulk upload
  const handleBulkUpload = async () => {
    if (!csvData.trim()) {
      setUploadMessage('Please enter data');
      return;
    }

    setIsLoading(true);
    try {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const linksToUpdate: Record<string, PlatformLinks> = {};

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 2) continue;

        const skuIndex = headers.findIndex(h => h.includes('sku') || h.includes('id'));
        const sku = skuIndex >= 0 ? values[skuIndex] : values[0];

        // Find product by SKU
        const product = products.find(p => 
          p.variants.some(v => v.sku === sku)
        );

        if (product) {
          const newLinks: PlatformLinks = { 
            wayfair: '',
            amazon: '',
            overstock: '',
            homeDepot: '',
            lowes: '',
            target: '',
            kohls: ''
          };
          
          PLATFORMS.forEach(platform => {
            const platformIndex = headers.findIndex(h => 
              h.includes(platform.key.toLowerCase()) || 
              h.includes(platform.label.toLowerCase().replace("'", "").replace(" ", ""))
            );
            if (platformIndex >= 0 && values[platformIndex]) {
              newLinks[platform.key as keyof PlatformLinks] = values[platformIndex];
            }
          });

          linksToUpdate[product.id] = newLinks;
        }
      }

      // Bulk update via API
      const result = await bulkUpdatePlatformLinks(linksToUpdate);
      
      if (result.success) {
        // Reload products to get updated links
        await loadProductsAndLinks();
        setUploadMessage(`Successfully updated ${result.updatedCount} products!`);
        setCsvData('');
      } else {
        setUploadMessage('Failed to update products. Please try again.');
      }
    } catch (error) {
      console.error('Error parsing data:', error);
      setUploadMessage('Error parsing data. Please check format.');
    } finally {
      setIsLoading(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const headers = ['SKU', ...PLATFORMS.map(p => p.label)];
    const sampleData = ['ABC123', 'https://wayfair.com/...', 'https://amazon.com/...', '', '', '', '', ''];
    const template = [headers.join(','), sampleData.join(',')].join('\n');
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'platform_links_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <h2>Admin Login</h2>
          {loginError && <div className="error-message">{loginError}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-button">Login</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <div className="admin-actions">
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Product List
        </button>
        <button 
          className={`tab-button ${activeTab === 'bulk' ? 'active' : ''}`}
          onClick={() => setActiveTab('bulk')}
        >
          Bulk Upload
        </button>
      </div>

      {isLoading && <div className="loading-indicator">Loading...</div>}

      {/* Product List Tab */}
      {activeTab === 'list' && (
        <div className="admin-content">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="products-list">
            <h2>Products ({filteredProducts.length})</h2>
            
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-item">
                <div className="product-info-row">
                  <div className="product-image-small">
                    {product.images.length > 0 && (
                      <img src={product.images[0].src} alt={product.title} />
                    )}
                  </div>
                  <div className="product-details">
                    <h3>{product.title}</h3>
                    <p className="product-sku">
                      SKU: {product.variants[0]?.sku || 'N/A'}
                    </p>
                    
                    <div className="platform-links-status">
                      {PLATFORMS.map(platform => {
                        const hasLink = product.platformLinks?.[platform.key as keyof PlatformLinks];
                        return (
                          <span 
                            key={platform.key} 
                            className={`status-badge ${hasLink ? 'active' : 'inactive'}`}
                          >
                            {platform.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleEditClick(product)}
                    className="edit-button"
                    disabled={isLoading}
                  >
                    Edit Links
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bulk Upload Tab */}
      {activeTab === 'bulk' && (
        <div className="bulk-upload-section">
          <h2>Bulk Upload Platform Links</h2>
          <p className="upload-instructions">
            Upload platform links using CSV format. Required columns: SKU, Wayfair, Amazon, Overstock, Home Depot, Lowe&apos;s, Target, Kohl&apos;s
          </p>
          
          <button onClick={downloadTemplate} className="template-button" disabled={isLoading}>
            Download Template
          </button>

          <div className="csv-input-container">
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder={`SKU,Wayfair,Amazon,Overstock,Home Depot,Lowe's,Target,Kohl's
ABC123,https://wayfair.com/...,https://amazon.com/...,...`}
              className="csv-textarea"
              rows={15}
              disabled={isLoading}
            />
          </div>

          {uploadMessage && (
            <div className={`upload-message ${uploadMessage.includes('Error') || uploadMessage.includes('Failed') ? 'error' : 'success'}`}>
              {uploadMessage}
            </div>
          )}

          <button onClick={handleBulkUpload} className="upload-button" disabled={isLoading}>
            {isLoading ? 'Uploading...' : 'Upload Links'}
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Edit Platform Links</h2>
            <p className="modal-product-title">{editingProduct.title}</p>
            <p className="modal-product-sku">SKU: {editingProduct.variants[0]?.sku || 'N/A'}</p>
            
            {PLATFORMS.map(platform => (
              <div className="form-group" key={platform.key}>
                <label>{platform.label} URL:</label>
                <input
                  type="text"
                  value={platformLinks[platform.key as keyof PlatformLinks] || ''}
                  onChange={(e) => setPlatformLinks({
                    ...platformLinks, 
                    [platform.key]: e.target.value
                  })}
                  placeholder={`https://www.${platform.key.toLowerCase()}.com/...`}
                  disabled={isLoading}
                />
              </div>
            ))}
            
            <div className="modal-actions">
              <button onClick={handleSaveLinks} className="save-button" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={handleCancelEdit} className="cancel-button" disabled={isLoading}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
