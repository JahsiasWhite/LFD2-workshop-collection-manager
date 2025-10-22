import React, { useState } from 'react';

const ImportCollection = ({ onImport, onClose }) => {
  const [collectionId, setCollectionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Use the backend proxy - the proxy in package.json will handle routing to the backend
    const proxyUrl = '/api/steam/ISteamRemoteStorage/GetCollectionDetails/v1/';
    const formData = new FormData();
    formData.append('collectioncount', '1');
    formData.append('publishedfileids[0]', collectionId);

    try {
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
        `Failed to import collection: ${err.message}. Please check your collection ID.`
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
            <label htmlFor="collectionId">Collection ID: </label>
            <input
              type="text"
              id="collectionId"
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value)}
              required
            />
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
