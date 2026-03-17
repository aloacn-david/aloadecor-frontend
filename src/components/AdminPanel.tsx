import React, { useState, useEffect } from 'react';
import { ShopifyService } from '../services/shopify';
import { ShopifyProduct, PlatformLinks } from '../types/shopify';
import { 
  getAllPlatformLinks, 
  updateProductPlatformLinks, 
  bulkUpdatePlatformLinks 
} from '../services/platformLinks';
import { aiAnalysisService, AnalysisResult, AnalysisStatus, StoredAnalysisResult } from '../services/aiAnalysis';
import { contentService } from '../services/contentService';
import { ContentTypeConfig, ProductContentStatus } from '../types/productContent';
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
  const [activeTab, setActiveTab] = useState<'list' | 'bulk' | 'analysis' | 'orders' | 'content'>('list');
  const [csvData, setCsvData] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // AI Analysis state
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [selectedAnalysisProduct, setSelectedAnalysisProduct] = useState<ShopifyProduct | null>(null);
  const [analysisReports, setAnalysisReports] = useState<Array<{ date: string; id: string; status: string; product_count: number }>>([]);
  
  // New AI Analysis state for product selection and result management
  const [storedAnalysisResults, setStoredAnalysisResults] = useState<StoredAnalysisResult[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState<{ progress: number; currentPlatform: string } | null>(null);
  const [selectedProductsForAnalysis, setSelectedProductsForAnalysis] = useState<Set<string>>(new Set());
  const [analysisView, setAnalysisView] = useState<'dashboard' | 'select' | 'results' | 'saved'>('dashboard');
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());

  // 预定义默认内容配置，永远显示13个选项
const DEFAULT_CONTENT_CONFIGS = [
  { type: '全美国杰西', label: '全美国杰西', icon: '🇺🇸', color: '#4CAF50', order: 1 },
  { type: '全计价表', label: '全计价表', icon: '📊', color: '#2196F3', order: 2 },
  { type: '新品product sheet', label: '新品product sheet', icon: '📋', color: '#FF9800', order: 3 },
  { type: '新品调研', label: '新品调研', icon: '🔍', color: '#9C27B0', order: 4 },
  { type: '上传价核价', label: '上传价核价', icon: '💰', color: '#F44336', order: 5 },
  { type: '主图', label: '主图', icon: '🖼️', color: '#00BCD4', order: 6 },
  { type: '白底图', label: '白底图', icon: '⬜', color: '#795548', order: 7 },
  { type: '细节图', label: '细节图', icon: '🔍', color: '#607D8B', order: 8 },
  { type: '尺寸图', label: '尺寸图', icon: '📏', color: '#3F51B5', order: 9 },
  { type: '安装视频', label: '安装视频', icon: '🎬', color: '#E91E63', order: 10 },
  { type: '场景视频/网红视频', label: '场景视频/网红视频', icon: '🎥', color: '#FF5722', order: 11 },
  { type: '文字', label: '文字', icon: '📝', color: '#8BC34A', order: 12 },
  { type: '新品上架', label: '新品上架', icon: '✅', color: '#4CAF50', order: 13 },
];

// Content Management state
  const [contentStatus, setContentStatus] = useState<Record<string, ProductContentStatus>>({});
  const [contentConfigs, setContentConfigs] = useState<ContentTypeConfig[]>(DEFAULT_CONTENT_CONFIGS); // 默认使用内置配置
  const [selectedProductForContent, setSelectedProductForContent] = useState<string | null>(null);
  const [contentSearchTerm, setContentSearchTerm] = useState('');
  const [contentFilterStatus, setContentFilterStatus] = useState<string>('all');

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

  // AI Analysis methods
  const loadAnalysisData = async () => {
    try {
      setIsLoading(true);
      const [status, reports] = await Promise.all([
        aiAnalysisService.getAnalysisStatus(),
        aiAnalysisService.getAnalysisReports()
      ]);
      setAnalysisStatus(status);
      setAnalysisReports(reports);
    } catch (error) {
      console.error('Error loading analysis data:', error);
      showToast('Failed to load analysis data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const runAnalysis = async (productId: string) => {
    try {
      setIsRunningAnalysis(true);
      const result = await aiAnalysisService.runAnalysis(productId);
      setAnalysisResults(prev => [result, ...prev]);
      showToast('Analysis completed successfully', 'success');
    } catch (error) {
      console.error('Error running analysis:', error);
      showToast('Failed to run analysis', 'error');
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  const analyzeProduct = async (product: ShopifyProduct, platform: string, url: string) => {
    try {
      setIsRunningAnalysis(true);
      const result = await aiAnalysisService.analyzeProduct(product, platform, url);
      setAnalysisResults(prev => [result, ...prev]);
      showToast('Product analysis completed', 'success');
    } catch (error) {
      console.error('Error analyzing product:', error);
      showToast('Failed to analyze product', 'error');
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  // 分析选中产品的所有平台链接
  const analyzeSelectedProductPlatforms = async (product: ShopifyProduct) => {
    try {
      setIsRunningAnalysis(true);
      setAnalysisProgress({ progress: 0, currentPlatform: 'starting' });
      setAnalysisView('results');
      
      const results = await aiAnalysisService.analyzeProductPlatforms(
        product,
        (progress, currentPlatform) => {
          setAnalysisProgress({ progress, currentPlatform });
        }
      );
      
      setStoredAnalysisResults(prev => [...results, ...prev]);
      showToast(`Analysis completed for ${product.title}. Analyzed ${results.length} platforms.`, 'success');
    } catch (error) {
      console.error('Error analyzing product platforms:', error);
      showToast('Failed to analyze product platforms', 'error');
    } finally {
      setIsRunningAnalysis(false);
      setAnalysisProgress(null);
    }
  };

  // 批量分析多个产品
  const analyzeMultipleProducts = async () => {
    const selectedProductsList = products.filter(p => selectedProductsForAnalysis.has(String(p.id)));
    
    if (selectedProductsList.length === 0) {
      showToast('Please select at least one product', 'error');
      return;
    }
    
    try {
      setIsRunningAnalysis(true);
      setAnalysisView('results');
      
      for (const product of selectedProductsList) {
        await analyzeSelectedProductPlatforms(product);
      }
      
      showToast(`Batch analysis completed for ${selectedProductsList.length} products`, 'success');
      setSelectedProductsForAnalysis(new Set());
    } catch (error) {
      console.error('Error in batch analysis:', error);
      showToast('Failed to complete batch analysis', 'error');
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  // 删除分析结果
  const deleteAnalysisResult = async (analysisId: string) => {
    try {
      const success = await aiAnalysisService.deleteAnalysisResult(analysisId);
      if (success) {
        setStoredAnalysisResults(prev => prev.filter(r => r.analysis_id !== analysisId));
        showToast('Analysis result deleted', 'success');
      }
    } catch (error) {
      console.error('Error deleting analysis result:', error);
      showToast('Failed to delete analysis result', 'error');
    }
  };

  // 批量删除分析结果
  const deleteSelectedResults = async () => {
    if (selectedResultIds.size === 0) {
      showToast('Please select results to delete', 'error');
      return;
    }
    
    try {
      const success = await aiAnalysisService.deleteMultipleAnalysisResults(Array.from(selectedResultIds));
      if (success) {
        setStoredAnalysisResults(prev => prev.filter(r => !selectedResultIds.has(r.analysis_id)));
        setSelectedResultIds(new Set());
        showToast(`${selectedResultIds.size} results deleted`, 'success');
      }
    } catch (error) {
      console.error('Error deleting results:', error);
      showToast('Failed to delete results', 'error');
    }
  };

  // 切换产品选择
  const toggleProductSelection = (productId: string) => {
    setSelectedProductsForAnalysis(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // 切换结果选择
  const toggleResultSelection = (analysisId: string) => {
    setSelectedResultIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(analysisId)) {
        newSet.delete(analysisId);
      } else {
        newSet.add(analysisId);
      }
      return newSet;
    });
  };

  // 获取有平台链接的产品
  const getProductsWithLinks = () => {
    return products.filter(p => 
      Object.values(p.platformLinks || {}).some(link => link && link.trim() !== '')
    );
  };

  // Load analysis data when switching to analysis tab
  useEffect(() => {
    if (activeTab === 'analysis' && isLoggedIn) {
      loadAnalysisData();
    }
  }, [activeTab, isLoggedIn]);

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
        <button 
          className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Content Management
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
              Automatically analyze product listings across all platforms. Select products to analyze their platform links.
            </p>
            
            {/* Analysis Navigation */}
            <div className="analysis-nav">
              <button 
                className={`nav-button ${analysisView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setAnalysisView('dashboard')}
              >
                Dashboard
              </button>
              <button 
                className={`nav-button ${analysisView === 'select' ? 'active' : ''}`}
                onClick={() => setAnalysisView('select')}
              >
                Select Products
              </button>
              <button 
                className={`nav-button ${analysisView === 'results' ? 'active' : ''}`}
                onClick={() => setAnalysisView('results')}
              >
                Analysis Results ({storedAnalysisResults.length})
              </button>
            </div>
            
            {/* Dashboard View */}
            {analysisView === 'dashboard' && (
              <div className="analysis-dashboard">
                <div className="analysis-card">
                  <h3>Quick Stats</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-value">{getProductsWithLinks().length}</span>
                      <span className="stat-label">Products with Links</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{storedAnalysisResults.length}</span>
                      <span className="stat-label">Analysis Results</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">
                        {storedAnalysisResults.filter(r => r.overall_score >= 80).length}
                      </span>
                      <span className="stat-label">High Quality</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">
                        {storedAnalysisResults.filter(r => r.overall_score < 60).length}
                      </span>
                      <span className="stat-label">Needs Improvement</span>
                    </div>
                  </div>
                  <button 
                    className="analyze-button primary"
                    onClick={() => setAnalysisView('select')}
                  >
                    Start New Analysis
                  </button>
                </div>
                
                <div className="analysis-card">
                  <h3>Recent Activity</h3>
                  {storedAnalysisResults.length > 0 ? (
                    <ul className="recent-list">
                      {storedAnalysisResults.slice(0, 5).map(result => (
                        <li key={result.analysis_id}>
                          <span className="recent-product">{result.product_name}</span>
                          <span className="recent-platform">{result.platform}</span>
                          <span className={`recent-score ${result.overall_score >= 80 ? 'good' : result.overall_score >= 60 ? 'average' : 'poor'}`}>
                            {result.overall_score}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-state">No analysis results yet. Start by selecting products to analyze.</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Select Products View */}
            {analysisView === 'select' && (
              <div className="analysis-select">
                <div className="select-header">
                  <h3>Select Products to Analyze</h3>
                  <p>Choose products with platform links. The system will automatically analyze all their platform links.</p>
                </div>
                
                <div className="select-actions">
                  <button 
                    className="action-button"
                    onClick={() => {
                      const allWithLinks = getProductsWithLinks().map(p => String(p.id));
                      setSelectedProductsForAnalysis(new Set(allWithLinks));
                    }}
                  >
                    Select All
                  </button>
                  <button 
                    className="action-button"
                    onClick={() => setSelectedProductsForAnalysis(new Set())}
                  >
                    Clear Selection
                  </button>
                  <button 
                    className="analyze-button primary"
                    onClick={analyzeMultipleProducts}
                    disabled={selectedProductsForAnalysis.size === 0 || isRunningAnalysis}
                  >
                    {isRunningAnalysis ? 'Analyzing...' : `Analyze Selected (${selectedProductsForAnalysis.size})`}
                  </button>
                </div>
                
                <div className="products-select-list">
                  {getProductsWithLinks().length > 0 ? (
                    getProductsWithLinks().map(product => {
                      const productId = String(product.id);
                      const isSelected = selectedProductsForAnalysis.has(productId);
                      const linkCount = Object.values(product.platformLinks || {}).filter(l => l && l.trim()).length;
                      
                      return (
                        <div 
                          key={product.id} 
                          className={`product-select-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleProductSelection(productId)}
                        >
                          <div className="select-checkbox">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => {}}
                            />
                          </div>
                          <div className="product-info">
                            <h4>{product.title}</h4>
                            <p>SKU: {product.variants[0]?.sku || 'N/A'}</p>
                            <p className="link-count">{linkCount} platform links</p>
                          </div>
                          <div className="product-actions">
                            <button 
                              className="quick-analyze-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                analyzeSelectedProductPlatforms(product);
                              }}
                              disabled={isRunningAnalysis}
                            >
                              Analyze Now
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="empty-state">No products with platform links found. Add platform links to products first.</p>
                  )}
                </div>
              </div>
            )}
            
            {/* Analysis Progress */}
            {isRunningAnalysis && analysisProgress && (
              <div className="analysis-progress-overlay">
                <div className="progress-card">
                  <h3>Analyzing...</h3>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${analysisProgress.progress}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">{analysisProgress.progress}% - Analyzing {analysisProgress.currentPlatform}</p>
                </div>
              </div>
            )}
            
            {/* Results View */}
            {analysisView === 'results' && (
              <div className="analysis-results-view">
                <div className="results-header">
                  <h3>Analysis Results</h3>
                  <div className="results-actions">
                    {selectedResultIds.size > 0 && (
                      <button 
                        className="delete-button"
                        onClick={deleteSelectedResults}
                      >
                        Delete Selected ({selectedResultIds.size})
                      </button>
                    )}
                    <button 
                      className="action-button"
                      onClick={() => setSelectedResultIds(new Set())}
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
                
                {storedAnalysisResults.length > 0 ? (
                  <div className="stored-results-list">
                    {storedAnalysisResults.map(result => (
                      <div key={result.analysis_id} className="stored-result-card">
                        <div className="result-select">
                          <input 
                            type="checkbox"
                            checked={selectedResultIds.has(result.analysis_id)}
                            onChange={() => toggleResultSelection(result.analysis_id)}
                          />
                        </div>
                        <div className="result-main">
                          <div className="result-header-row">
                            <h4>{result.product_name}</h4>
                            <div className={`score-badge ${result.overall_score >= 80 ? 'good' : result.overall_score >= 60 ? 'average' : 'poor'}`}>
                              {result.overall_score}/100
                            </div>
                          </div>
                          <div className="result-meta">
                            <span className="platform-tag">{result.platform}</span>
                            <span className="sku-tag">{result.sku}</span>
                            <span className="date-tag">{new Date(result.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="result-metrics">
                            <div className="metric">
                              <span className="metric-label">Title:</span>
                              <span className="metric-value">{result.analysis.title.score}/100</span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">Images:</span>
                              <span className="metric-value">{result.analysis.images.count}</span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">Params:</span>
                              <span className="metric-value">{result.analysis.parameters.completeness}/100</span>
                            </div>
                          </div>
                          {result.priority_suggestions.length > 0 && (
                            <div className="result-suggestions">
                              <strong>Top Suggestion:</strong> {result.priority_suggestions[0].issue}
                            </div>
                          )}
                        </div>
                        <div className="result-actions">
                          <a 
                            href={result.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="view-link-btn"
                          >
                            View Link
                          </a>
                          <button 
                            className="delete-btn"
                            onClick={() => deleteAnalysisResult(result.analysis_id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No analysis results yet.</p>
                    <button 
                      className="analyze-button"
                      onClick={() => setAnalysisView('select')}
                    >
                      Start Analysis
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Legacy Analysis Results (keep for compatibility) */}
            {analysisResults.length > 0 && (
              <div className="analysis-results legacy">
                <h3>Legacy Analysis Results</h3>
                <div className="results-grid">
                  {analysisResults.map(result => (
                    <div key={result.product_id} className="result-card">
                      <div className="result-header">
                        <h4>Product: {result.sku}</h4>
                        <div className="overall-score">
                          Score: {result.overall_score}/100
                        </div>
                      </div>
                      <div className="result-details">
                        <p><strong>Platform:</strong> {result.platform}</p>
                        <p><strong>URL:</strong> <a href={result.url} target="_blank" rel="noopener noreferrer">View Link</a></p>
                        <div className="analysis-metrics">
                          <div className="metric">
                            <span className="metric-label">Title Score:</span>
                            <span className="metric-value">{result.analysis.title.score}/100</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Images:</span>
                            <span className="metric-value">{result.analysis.images.count} ({result.analysis.images.diversity_score}/100)</span>
                          </div>
                          <div className="metric">
                            <span className="metric-label">Parameters:</span>
                            <span className="metric-value">{result.analysis.parameters.completeness}/100</span>
                          </div>
                        </div>
                        {result.analysis.title.issues.length > 0 && (
                          <div className="issues-section">
                            <h5>Issues:</h5>
                            <ul className="issues-list">
                              {result.analysis.title.issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {result.priority_suggestions.length > 0 && (
                          <div className="priority-section">
                            <h5>Priority Suggestions:</h5>
                            <ul className="priority-list">
                              {result.priority_suggestions.map((suggestion, index) => (
                                <li key={index}>
                                  <div className="suggestion-header">
                                    <span className={`priority-badge priority-${suggestion.priority}`}>P{suggestion.priority}</span>
                                    <span className="suggestion-category">{suggestion.category}</span>
                                  </div>
                                  <p className="suggestion-issue">{suggestion.issue}</p>
                                  <p className="suggestion-recommendation">{suggestion.recommendation}</p>
                                  <p className="suggestion-impact">Expected impact: {suggestion.expected_impact}</p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      {/* Content Management Tab */}
      {activeTab === 'content' && (
        <div className="admin-content">
          <div className="content-management-section">
            <h2>Content Management</h2>
            <p className="section-description">
              Manage product listing content status. Check the boxes to mark content as completed.
            </p>

            {/* Filter Bar */}
            <div className="content-filter-bar">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Search product name or SKU..."
                  value={contentSearchTerm}
                  onChange={(e) => setContentSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-select">
                <select
                  value={contentFilterStatus}
                  onChange={(e) => setContentFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="partial">Partially Completed</option>
                  <option value="not_started">Not Started</option>
                </select>
              </div>
              <button 
                className="refresh-btn"
                onClick={async () => {
                  try {
                    const [statusData, configs] = await Promise.all([
                      contentService.getAllContentStatus(),
                      contentService.getContentTypeConfigs()
                    ]);
                    
                    const statusMap: Record<string, ProductContentStatus> = {};
                    statusData.forEach(status => {
                      statusMap[status.product_id] = status;
                    });
                    setContentStatus(statusMap);
                    
                    // 如果API返回配置，就更新，否则保持默认配置
                    if (configs && configs.length > 0) {
                      configs.sort((a, b) => a.order - b.order);
                      setContentConfigs(configs);
                    }
                    
                    showToast('Content status refreshed', 'success');
                  } catch (error) {
                    console.error('Failed to load content status:', error);
                    showToast('Content status loaded (offline mode)', 'info');
                    // API失败时保持使用本地默认配置，不报错
                  }
                }}
              >
                🔄 Refresh
              </button>
            </div>

            {/* Products List */}
            <div className="content-products-list">
              {products
                .filter(product => {
                  const matchesSearch = 
                    product.title.toLowerCase().includes(contentSearchTerm.toLowerCase()) ||
                    (product.variants[0]?.sku || '').toLowerCase().includes(contentSearchTerm.toLowerCase());
                  
                  if (!matchesSearch) return false;

                  const status = contentStatus[String(product.id)];
                  if (contentFilterStatus === 'all') return true;
                  
                  if (!status) {
                    return contentFilterStatus === 'not_started';
                  }

                  if (contentFilterStatus === 'completed') {
                    return status.completion_rate === 100;
                  } else if (contentFilterStatus === 'partial') {
                    return status.completion_rate > 0 && status.completion_rate < 100;
                  } else if (contentFilterStatus === 'not_started') {
                    return status.completion_rate === 0;
                  }
                  
                  return true;
                })
                .map(product => {
                  const status = contentStatus[String(product.id)];
                  const completionRate = status?.completion_rate || 0;
                  const completedCount = status?.completed_count || 0;

                  return (
                    <div key={product.id} className="content-product-card">
                      <div 
                        className="product-header"
                        onClick={() => {
                          if (selectedProductForContent === String(product.id)) {
                            setSelectedProductForContent(null);
                          } else {
                            setSelectedProductForContent(String(product.id));
                          }
                        }}
                      >
                        <div className="product-info">
                          <h4>{product.title}</h4>
                          <p className="sku">SKU: {product.variants[0]?.sku || 'N/A'}</p>
                        </div>
                        <div className="product-progress">
                          <div className="progress-bar-small">
                            <div 
                              className="progress-fill"
                              style={{ width: `${completionRate}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">
                            {completedCount}/13 ({completionRate}%)
                          </span>
                          <span className="toggle-icon">
                            {selectedProductForContent === String(product.id) ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>

                      {/* Expandable content checkboxes */}
                      {selectedProductForContent === String(product.id) && (
                        <div className="content-checkboxes">
                          <div className="checkboxes-grid">
                            {contentConfigs.map(config => {
                              const isChecked = status?.status?.[config.type] || false;
                              return (
                                <label key={config.type} className="content-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={async (e) => {
                                      // 先本地更新状态，让界面立刻有反应
                                      const productId = String(product.id);
                                      const newStatus = e.target.checked;
                                      
                                      // 更新本地状态
                                      setContentStatus(prev => {
                                        const currentStatus = prev[productId] || {
                                          status: {},
                                          completed_count: 0,
                                          completion_rate: 0
                                        };
                                        
                                        const updatedStatus = {
                                          ...currentStatus,
                                          status: {
                                            ...currentStatus.status,
                                            [config.type]: newStatus
                                          }
                                        };
                                        
                                        // 重新计算完成数量和完成率
                                        const completedCount = Object.values(updatedStatus.status).filter(Boolean).length;
                                        const completionRate = Math.round((completedCount / 13) * 100 * 100) / 100;
                                        
                                        return {
                                          ...prev,
                                          [productId]: {
                                            ...updatedStatus,
                                            completed_count: completedCount,
                                            completion_rate: completionRate
                                          }
                                        };
                                      });
                                      
                                      // 尝试同步到后端
                                      try {
                                        const updatedStatus = await contentService.updateProductContentStatus(
                                          productId,
                                          {
                                            status_updates: {
                                              [config.type]: newStatus
                                            },
                                            updated_by: 'admin'
                                          }
                                        );
                                        
                                        setContentStatus(prev => ({
                                          ...prev,
                                          [productId]: updatedStatus
                                        }));
                                        
                                        showToast(`Updated ${config.label} status`, 'success');
                                      } catch (error) {
                                        console.error('Backend unavailable, status saved locally:', error);
                                        showToast('Status saved locally (offline mode)', 'info');
                                        // 后端不可用时，状态保存在本地内存和localStorage
                                        localStorage.setItem(`content_status_${productId}`, JSON.stringify(contentStatus[productId]));
                                      }
                                    }}
                                  />
                                  <span 
                                    className="checkbox-label"
                                    style={{ color: isChecked ? config.color : '#666' }}
                                  >
                                    <span className="icon">{config.icon}</span>
                                    <span className="label">{config.label}</span>
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          
                          <div className="content-actions">
                            <button 
                              className="mark-all-btn"
                              onClick={async () => {
                                const productId = String(product.id);
                                
                                // 先本地更新
                                setContentStatus(prev => {
                                  const currentStatus = prev[productId] || {
                                    status: {},
                                    completed_count: 0,
                                    completion_rate: 0
                                  };
                                  
                                  // 全部设为true
                                  const newStatus: any = {};
                                  contentConfigs.forEach(config => {
                                    newStatus[config.type] = true;
                                  });
                                  
                                  return {
                                    ...prev,
                                    [productId]: {
                                      ...currentStatus,
                                      status: newStatus,
                                      completed_count: 13,
                                      completion_rate: 100
                                    }
                                  };
                                });
                                
                                // 尝试同步到后端
                                try {
                                  const updates: any = {};
                                  contentConfigs.forEach(config => {
                                    updates[config.type] = true;
                                  });
                                  
                                  const updatedStatus = await contentService.updateProductContentStatus(
                                    productId,
                                    {
                                      status_updates: updates,
                                      updated_by: 'admin'
                                    }
                                  );
                                  
                                  setContentStatus(prev => ({
                                    ...prev,
                                    [productId]: updatedStatus
                                  }));
                                  
                                  showToast('Marked all as completed', 'success');
                                } catch (error) {
                                  console.error('Backend unavailable, status saved locally:', error);
                                  showToast('All marked as completed (offline mode)', 'info');
                                  localStorage.setItem(`content_status_${productId}`, JSON.stringify(contentStatus[productId]));
                                }
                              }}
                            >
                              ✅ Mark All Completed
                            </button>
                            <button 
                              className="clear-all-btn"
                              onClick={async () => {
                                const productId = String(product.id);
                                
                                // 先本地更新
                                setContentStatus(prev => {
                                  const currentStatus = prev[productId] || {
                                    status: {},
                                    completed_count: 0,
                                    completion_rate: 0
                                  };
                                  
                                  // 全部设为false
                                  const newStatus: any = {};
                                  contentConfigs.forEach(config => {
                                    newStatus[config.type] = false;
                                  });
                                  
                                  return {
                                    ...prev,
                                    [productId]: {
                                      ...currentStatus,
                                      status: newStatus,
                                      completed_count: 0,
                                      completion_rate: 0
                                    }
                                  };
                                });
                                
                                // 尝试同步到后端
                                try {
                                  const updates: any = {};
                                  contentConfigs.forEach(config => {
                                    updates[config.type] = false;
                                  });
                                  
                                  const updatedStatus = await contentService.updateProductContentStatus(
                                    productId,
                                    {
                                      status_updates: updates,
                                      updated_by: 'admin'
                                    }
                                  );
                                  
                                  setContentStatus(prev => ({
                                    ...prev,
                                    [productId]: updatedStatus
                                  }));
                                  
                                  showToast('Cleared all status', 'info');
                                } catch (error) {
                                  console.error('Backend unavailable, status saved locally:', error);
                                  showToast('All status cleared (offline mode)', 'info');
                                  localStorage.setItem(`content_status_${productId}`, JSON.stringify(contentStatus[productId]));
                                }
                              }}
                            >
                              🗑️ Clear All
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
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
