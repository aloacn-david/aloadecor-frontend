import React, { useState, useEffect } from 'react';

const DebugPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[DebugPage] Fetching from backend...');
        const response = await fetch('http://localhost:8080/api/shopify/products');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('[DebugPage] Received data:', result);
        console.log('[DebugPage] Data type:', typeof result);
        console.log('[DebugPage] Is array:', Array.isArray(result));
        console.log('[DebugPage] Length:', result.length);
        
        setData(result);
        setLoading(false);
      } catch (err: any) {
        console.error('[DebugPage] Error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Debug Page - Backend Data</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '8px' }}>
        <strong>Data Type:</strong> {typeof data} | 
        <strong> Is Array:</strong> {Array.isArray(data) ? 'Yes' : 'No'} | 
        <strong> Length:</strong> {Array.isArray(data) ? data.length : 'N/A'}
      </div>
      
      {Array.isArray(data) && data.length > 0 ? (
        <div>
          <h2>Products ({data.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {data.map((product: any, index: number) => (
              <div key={index} style={{ border: '2px solid #ddd', padding: '15px', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 10px 0' }}>Product {index + 1}</h3>
                <p><strong>ID:</strong> {product.id}</p>
                <p><strong>Title:</strong> {product.title}</p>
                <p><strong>Description:</strong> {product.description ? product.description.substring(0, 100) + '...' : 'No description'}</p>
                <p><strong>Images:</strong> {product.images ? product.images.length : 0}</p>
                
                {product.images && product.images.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <p><strong>First Image:</strong></p>
                    <img 
                      src={product.images[0].src} 
                      alt={product.title} 
                      style={{ width: '100%', height: '200px', objectFit: 'cover', border: '1px solid #ccc' }}
                      onError={(e) => {
                        console.error(`[DebugPage] Image error for product ${index}:`, e);
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image+Error';
                      }}
                    />
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      URL: {product.images[0].src}
                    </p>
                  </div>
                )}
                
                <div style={{ marginTop: '10px' }}>
                  <p><strong>Platform Links:</strong></p>
                  <ul style={{ fontSize: '12px' }}>
                    <li>Wayfair: {product.platformLinks?.wayfair ? '✓' : '✗'}</li>
                    <li>Amazon: {product.platformLinks?.amazon ? '✓' : '✗'}</li>
                    <li>Overstock: {product.platformLinks?.overstock ? '✓' : '✗'}</li>
                    <li>Home Depot: {product.platformLinks?.homeDepot ? '✓' : '✗'}</li>
                    <li>Lowe's: {product.platformLinks?.lowes ? '✓' : '✗'}</li>
                    <li>Target: {product.platformLinks?.target ? '✓' : '✗'}</li>
                    <li>Kohl's: {product.platformLinks?.kohls ? '✓' : '✗'}</li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: '20px', background: '#ffcccc', borderRadius: '8px' }}>
          <strong>⚠️ No products found or data is not an array</strong>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DebugPage;