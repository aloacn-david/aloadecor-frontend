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
  { key: 'amazon1', label: 'Amazon 1' },
  { key: 'amazon2', label: 'Amazon 2' },
  { key: 'wf1', label: 'WF 1' },
  { key: 'wf2', label: 'WF 2' },
  { key: 'os1', label: 'OS 1' },
  { key: 'os2', label: 'OS 2' },
  { key: 'hd1', label: 'HD 1' },
  { key: 'hd2', label: 'HD 2' },
  { key: 'lowes', label: "Lowe's" },
  { key: 'target', label: 'Target' },
  { key: 'walmart', label: 'Walmart' },
  { key: 'ebay', label: 'Ebay' },
  { key: 'kohls', label: "Kohl's" },
] as const;

interface AdminPanelProps {
  onLinksUpdated: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLinksUpdated }) => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopifyProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<ShopifyProduct | null>(null);
  const [platformLinks, setPlatformLinks] = useState<PlatformLinks>({
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
  });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'bulk' | 'analysis' | 'orders'>('list');
  const [csvData, setCsvData] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Mock admin credentials - in a real app, this would be handled securely
  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: '1234'
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
      console.log('[LoadProducts] Starting to load products and links...');
      const shopifyService = new ShopifyService();
      const [products, platformLinksData] = await Promise.all([
        shopifyService.fetchProducts(),
        getAllPlatformLinks()
      ]);
      
      console.log('[LoadProducts] Fetched', products.length, 'products from Shopify');
      console.log('[LoadProducts] First product data:', products[0]);
      console.log('[LoadProducts] First product platformLinks:', products[0].platformLinks);
      console.log('[LoadProducts] Fetched platform links for', Object.keys(platformLinksData).length, 'products');
      
      // Merge products with platform links from backend
      // Always use platform links API data (more reliable)
      const productsWithLinks = products.map(product => {
        const productId = String(product.id);
        
        // Use platform links API data
        const links = platformLinksData[productId];
        if (links) {
          console.log(`[LoadProducts] Product ${productId} (${product.title}) using platform links from API:`, links);
          return {
            ...product,
            platformLinks: links
          };
        }
        
        // Fallback to Shopify API data
        if (product.platformLinks) {
          console.log(`[LoadProducts] Product ${productId} (${product.title}) using platform links from Shopify API:`, product.platformLinks);
          return product;
        }
        
        // Fallback to empty links
        console.log(`[LoadProducts] Product ${productId} (${product.title}) using empty platform links`);
        return {
          ...product,
          platformLinks: {
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
          }
        };
      });
      
      const productsWithActiveLinks = productsWithLinks.filter(p => 
        Object.values(p.platformLinks || {}).some(link => link && link.trim() !== '')
      );
      console.log('[LoadProducts]', productsWithActiveLinks.length, 'products have active links');
      
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
      amazon1: product.platformLinks?.amazon1 || '',
      amazon2: product.platformLinks?.amazon2 || '',
      wf1: product.platformLinks?.wf1 || '',
      wf2: product.platformLinks?.wf2 || '',
      os1: product.platformLinks?.os1 || '',
      os2: product.platformLinks?.os2 || '',
      hd1: product.platformLinks?.hd1 || '',
      hd2: product.platformLinks?.hd2 || '',
      lowes: product.platformLinks?.lowes || '',
      target: product.platformLinks?.target || '',
      walmart: product.platformLinks?.walmart || '',
      ebay: product.platformLinks?.ebay || '',
      kohls: product.platformLinks?.kohls || '',
    });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveLinks = async () => {
    if (!editingProduct) return;

    setSaveStatus('saving');
    setIsLoading(true);
    
    try {
      const success = await updateProductPlatformLinks(String(editingProduct.id), platformLinks);
      
      if (success) {
        const updatedProducts = products.map(product => 
          String(product.id) === String(editingProduct.id) 
            ? { ...product, platformLinks: { ...platformLinks } } 
            : product
        );

        setProducts(updatedProducts);
        setFilteredProducts(updatedProducts);
        setSaveStatus('saved');
        setLastSaved(new Date());
        
        // 通知 App 组件更新产品数据
        onLinksUpdated();
        
        const linksCount = Object.values(platformLinks).filter(link => link.trim() !== '').length;
        showToast(`✓ 已成功保存 ${linksCount} 个平台链接到数据库！`, 'success');
        
        setTimeout(() => {
          setEditingProduct(null);
          setSaveStatus('idle');
        }, 1500);
      } else {
        setSaveStatus('error');
        showToast('✗ 保存失败，请检查网络连接后重试', 'error');
      }
    } catch (error) {
      console.error('Error saving links:', error);
      setSaveStatus('error');
      showToast('✗ 保存出错：' + (error instanceof Error ? error.message : '未知错误'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件大小（限制为 10MB）
      if (file.size > 10 * 1024 * 1024) {
        setUploadMessage('File too large. Please upload files smaller than 10MB.');
        return;
      }
      
      // 检查文件类型
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
        setUploadMessage('Please upload a CSV or TXT file.');
        return;
      }
      
      setSelectedFile(file);
      setUploadMessage(`Selected file: ${file.name}`);
      
      // Read file content
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCsvData(content);
      };
      reader.onerror = () => {
        setUploadMessage('Error reading file. Please try again.');
      };
      reader.readAsText(file);
    }
  };

  // Handle CSV/Excel bulk upload
  const handleBulkUpload = async () => {
    if (!csvData.trim()) {
      setUploadMessage('Please select a file');
      return;
    }

    setIsLoading(true);
    try {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      console.log('[Bulk Upload] CSV Headers:', headers);
      console.log('[Bulk Upload] Total lines:', lines.length);
      
      const linksToUpdate: Record<string, PlatformLinks> = {};
      let matchedProducts = 0;
      let unmatchedSkus: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 2) continue;

        const skuIndex = headers.findIndex(h => 
          h.toLowerCase().includes('sku') || h.toLowerCase().includes('id')
        );
        const sku = skuIndex >= 0 ? values[skuIndex] : values[0];
        
        console.log(`[Bulk Upload] Line ${i}: SKU=${sku}, Values=`, values);

        // Find product by SKU (case-insensitive)
        const product = products.find(p => 
          p.variants.some(v => v.sku && v.sku.toLowerCase() === sku.toLowerCase())
        );

        if (product) {
          matchedProducts++;
          console.log(`[Bulk Upload] Found product: ${product.title} (ID: ${product.id})`);
          
          const newLinks: PlatformLinks = {
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

          PLATFORMS.forEach(platform => {
            const platformKey = platform.key.toLowerCase();
            const platformLabel = platform.label.toLowerCase().replace(/['\s]/g, '');
            
            const platformIndex = headers.findIndex((h, idx) => {
              const header = h.toLowerCase().trim();
              const headerClean = header.replace(/['\s]/g, '');
              
              // Match by key (e.g., "amazon1", "wf1")
              if (headerClean === platformKey || headerClean.includes(platformKey)) {
                console.log(`[Bulk Upload] Matched ${platform.key} at column ${idx}: "${h}" -> "${values[idx]}"`);
                return true;
              }
              // Match by label (e.g., "amazon1", "wf1", "lowes")
              if (headerClean === platformLabel || headerClean.includes(platformLabel)) {
                console.log(`[Bulk Upload] Matched ${platform.key} at column ${idx}: "${h}" -> "${values[idx]}"`);
                return true;
              }
              return false;
            });
            
            if (platformIndex >= 0 && values[platformIndex]) {
              newLinks[platform.key as keyof PlatformLinks] = values[platformIndex];
            }
          });

          linksToUpdate[String(product.id)] = newLinks;
          console.log(`[Bulk Upload] Links for ${sku}:`, newLinks);
        } else {
          unmatchedSkus.push(sku);
          console.log(`[Bulk Upload] Product not found for SKU: ${sku}`);
        }
      }
      
      console.log(`[Bulk Upload] Matched ${matchedProducts} products`);
      console.log(`[Bulk Upload] Unmatched SKUs:`, unmatchedSkus);

      // Bulk update via API
      const result = await bulkUpdatePlatformLinks(linksToUpdate);
      
      if (result.success) {
        const updatedCount = result.updatedCount || Object.keys(linksToUpdate).length;
        const productIds = Object.keys(linksToUpdate);
        console.log('[Bulk Upload] Successfully updated products:', productIds);
        console.log('[Bulk Upload] Links data:', linksToUpdate);
        setUploadMessage('');
        setCsvData('');
        setSelectedFile(null);
        showToast(`✓ 已成功保存 ${updatedCount} 个产品的平台链接到数据库！`, 'success');
        setLastSaved(new Date());
        
        // 通知 App 组件更新产品数据
        onLinksUpdated();
        
        // 不需要调用 loadProductsAndLinks，因为 onLinksUpdated 会重新加载数据
      } else {
        showToast('✗ 批量保存失败，请检查数据格式后重试', 'error');
        setUploadMessage('Failed to update products. Please try again.');
      }
    } catch (error) {
      console.error('Error parsing data:', error);
      showToast('✗ 数据解析错误，请检查CSV格式', 'error');
      setUploadMessage('Error parsing data. Please check format.');
    } finally {
      setIsLoading(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const headers = ['SKU', ...PLATFORMS.map(p => p.label)];
    
    // Build CSV rows from existing products
    const rows: string[] = [headers.join(',')];
    
    products.forEach(product => {
      const sku = product.variants[0]?.sku || '';
      if (!sku) return;
      
      const links = product.platformLinks || {};
      const rowData = [
        sku,
        links.amazon1 || '',
        links.amazon2 || '',
        links.wf1 || '',
        links.wf2 || '',
        links.os1 || '',
        links.os2 || '',
        links.hd1 || '',
        links.hd2 || '',
        links.lowes || '',
        links.target || '',
        links.walmart || '',
        links.ebay || '',
        links.kohls || ''
      ];
      
      // Escape values that contain commas
      const escapedRow = rowData.map(val => {
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      });
      
      rows.push(escapedRow.join(','));
    });
    
    // Add a sample row if no products
    if (rows.length === 1) {
      const sampleData = ['ABC123', 'https://amazon.com/...', 'https://amazon.com/...', 'https://wayfair.com/...', 'https://wayfair.com/...', 'https://overstock.com/...', 'https://overstock.com/...', 'https://homedepot.com/...', 'https://homedepot.com/...', 'https://lowes.com/...', 'https://target.com/...', 'https://walmart.com/...', 'https://ebay.com/...', 'https://kohls.com/...'];
      rows.push(sampleData.join(','));
    }
    
    const template = rows.join('\n');

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'platform_links_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <h2>Admin Login v2.1</h2>
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
        <button 
          className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          AI Analysis
        </button>
        <button 
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Order Summary
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
                        // 使用类型断言确保类型正确
                        const link = product.platformLinks?.[platform.key as keyof typeof product.platformLinks] || '';
                        const hasLink = link && link.trim() !== '';
                        
                        // 为所有平台添加调试信息
                        console.log(`[AdminPanel] ${product.title} - ${platform.label} (${platform.key}): link="${link}", hasLink=${hasLink}`);
                        
                        // 定义平台颜色映射
                        const platformColors: Record<string, { bg: string; color: string }> = {
                          amazon1: { bg: '#ff9900', color: '#000' },
                          amazon2: { bg: '#ff9900', color: '#000' },
                          wf1: { bg: '#7b1fa2', color: '#fff' },
                          wf2: { bg: '#7b1fa2', color: '#fff' },
                          os1: { bg: '#c41230', color: '#fff' },
                          os2: { bg: '#c41230', color: '#fff' },
                          hd1: { bg: '#f96302', color: '#fff' },
                          hd2: { bg: '#f96302', color: '#fff' },
                          lowes: { bg: '#004990', color: '#fff' },
                          target: { bg: '#cc0000', color: '#fff' },
                          walmart: { bg: '#0071ce', color: '#fff' },
                          ebay: { bg: '#e53238', color: '#fff' },
                          kohls: { bg: '#c41230', color: '#fff' }
                        };
                        
                        // 获取当前平台的颜色
                        const platformColor = platformColors[platform.key] || { bg: '#e5e5e5', color: '#999' };
                        
                        return (
                          <span 
                            key={platform.key} 
                            className={`status-badge ${hasLink ? 'active' : 'inactive'}`}
                            data-platform={platform.key}
                            style={hasLink ? {
                              backgroundColor: platformColor.bg,
                              color: platformColor.color,
                              padding: '0.25rem 0.5rem',
                              borderRadius: '3px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              marginRight: '0.5rem',
                              display: 'inline-block'
                            } : {
                              backgroundColor: '#e5e5e5',
                              color: '#999',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '3px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              marginRight: '0.5rem',
                              display: 'inline-block'
                            }}
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
            Upload a CSV file with platform links. Required columns: SKU, Amazon 1, Amazon 2, WF 1, WF 2, OS 1, OS 2, HD 1, HD 2, Lowe&apos;s, Target, Walmart, Ebay, Kohl&apos;s
          </p>
          
          <button onClick={downloadTemplate} className="template-button" disabled={isLoading}>
            下载现有产品链接表格
          </button>

          <div className="file-upload-container">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileSelect}
              className="file-input"
              disabled={isLoading}
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="file-input-label">
              {selectedFile ? `Selected: ${selectedFile.name}` : 'Choose CSV File'}
            </label>
          </div>

          {uploadMessage && (
            <div className={`upload-message ${uploadMessage.includes('Error') || uploadMessage.includes('Failed') || uploadMessage.includes('Please') ? 'error' : 'success'}`}>
              {uploadMessage}
            </div>
          )}

          <button onClick={handleBulkUpload} className="upload-button" disabled={isLoading || !selectedFile}>
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
                  disabled={isLoading || saveStatus === 'saving'}
                />
              </div>
            ))}
            
            {saveStatus === 'saved' && lastSaved && (
              <div className="save-success-indicator">
                ✓ 已保存到数据库 ({lastSaved.toLocaleTimeString()})
              </div>
            )}
            
            {saveStatus === 'error' && (
              <div className="save-error-indicator">
                ✗ 保存失败，请重试
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                onClick={handleSaveLinks} 
                className={`save-button ${saveStatus === 'saved' ? 'saved' : ''} ${saveStatus === 'error' ? 'error' : ''}`} 
                disabled={isLoading || saveStatus === 'saving'}
              >
                {saveStatus === 'saving' && (
                  <>
                    <span className="spinner"></span>
                    保存中...
                  </>
                )}
                {saveStatus === 'saved' && '✓ 已保存'}
                {saveStatus === 'error' && '✗ 重试保存'}
                {saveStatus === 'idle' && (isLoading ? 'Saving...' : '💾 保存到数据库')}
              </button>
              <button onClick={handleCancelEdit} className="cancel-button" disabled={isLoading || saveStatus === 'saving'}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Analysis Tab */}
      {activeTab === 'analysis' && (
        <div className="admin-content">
          <div className="analysis-section">
            <h2>AI Product Analysis</h2>
            <p className="section-description">
              Weekly or bi-weekly analysis of product links performance
            </p>
            
            <div className="analysis-dashboard">
              <div className="analysis-card">
                <h3>Analysis Status</h3>
                <p>Last analysis: March 15, 2026</p>
                <p>Next scheduled analysis: March 22, 2026</p>
                <button className="analyze-button">
                  Run Analysis Now
                </button>
              </div>
              
              <div className="analysis-card">
                <h3>Analysis Reports</h3>
                <ul className="report-list">
                  <li>
                    <span className="report-date">March 15, 2026</span>
                    <a href="#" className="report-link">View Report</a>
                  </li>
                  <li>
                    <span className="report-date">March 1, 2026</span>
                    <a href="#" className="report-link">View Report</a>
                  </li>
                  <li>
                    <span className="report-date">February 15, 2026</span>
                    <a href="#" className="report-link">View Report</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Summary Tab */}
      {activeTab === 'orders' && (
        <div className="admin-content">
          <div className="orders-section">
            <h2>Order Summary</h2>
            <p className="section-description">
              Daily order summary downloads
            </p>
            
            <div className="orders-dashboard">
              <div className="orders-card">
                <h3>Today's Orders</h3>
                <p>Date: March 11, 2026</p>
                <p>Total Orders: 42</p>
                <p>Total Revenue: $5,247.99</p>
                <button className="download-button">
                  Download Today's Summary
                </button>
              </div>
              
              <div className="orders-card">
                <h3>Order History</h3>
                <ul className="order-list">
                  <li>
                    <span className="order-date">March 10, 2026</span>
                    <a href="#" className="order-link">Download</a>
                  </li>
                  <li>
                    <span className="order-date">March 9, 2026</span>
                    <a href="#" className="order-link">Download</a>
                  </li>
                  <li>
                    <span className="order-date">March 8, 2026</span>
                    <a href="#" className="order-link">Download</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className={`toast-notification ${toastMessage.type}`}>
          {toastMessage.message}
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
