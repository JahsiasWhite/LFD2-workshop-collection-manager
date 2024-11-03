import React, { useState } from 'react';

const ImportCollection = ({ onImport, onClose }) => {
  const [collectionId, setCollectionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const proxyUrl = `/ISteamRemoteStorage/GetCollectionDetails/v1/`;
    const formData = new FormData();
    formData.append('collectioncount', '1');
    formData.append('publishedfileids[0]', collectionId);

    try {
      const response = await fetch(proxyUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch collection');
      }
      const data = await response.json();

      onImport(data.response.collectiondetails[0]);
      onClose();
    } catch (err) {
      setError(
        'Failed to import collection. Please check your API key and collection ID.'
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
            <button type="submit" disabled={isLoading}>
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
