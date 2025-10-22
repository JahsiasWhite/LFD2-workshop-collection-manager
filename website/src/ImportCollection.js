import React, { useState } from 'react';

const ImportCollection = ({ onImport, onClose }) => {
  const [collectionId, setCollectionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract collection ID from URL or use as-is if it's already an ID
  const extractCollectionId = (input) => {
    // If it's already just a number, return it
    if (/^\d+$/.test(input.trim())) {
      return input.trim();
    }
    
    // Try to extract ID from Steam URL
    const urlPattern = /steamcommunity\.com\/sharedfiles\/filedetails\/\?id=(\d+)/;
    const match = input.match(urlPattern);
    
    if (match) {
      return match[1];
    }
    
    throw new Error('Invalid Steam collection URL or ID');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const extractedId = extractCollectionId(collectionId);
      
      // Use the backend proxy - the proxy in package.json will handle routing to the backend
      const proxyUrl = '/api/steam/ISteamRemoteStorage/GetCollectionDetails/v1/';
      const formData = new FormData();
      formData.append('collectioncount', '1');
      formData.append('publishedfileids[0]', extractedId);

      console.log('Fetching collection from:', proxyUrl);
      const response = await fetch(proxyUrl, {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Collection data received:', data);

      if (!data.response || !data.response.collectiondetails || data.response.collectiondetails.length === 0) {
        throw new Error('No collection found with that ID');
      }

      onImport(data.response.collectiondetails[0]);
      onClose();
    } catch (err) {
      console.error('Import error:', err);
      setError(
        `Failed to import collection: ${err.message}. Please check your collection URL or ID.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="import-collection-popup">
      <div className="popup-content">
        <h2>Import Steam Collection</h2>
        <form onSubmit={handleSubmit}>
          {/* <div>
            <label htmlFor="apiKey">Steam API Key:</label>
            <input
              type="text"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
            />
          </div> */}
          <div>
            <label htmlFor="collectionId">Steam Collection URL or ID: </label>
            <input
              type="text"
              id="collectionId"
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              placeholder="https://steamcommunity.com/sharedfiles/filedetails/?id=3140149743 or just 3140149743"
              required
            />
            <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
              You can paste the full Steam collection URL or just the collection ID
            </small>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="popup-buttons">
            <button
              className="import-button"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Importing...' : 'Import'}
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportCollection;
