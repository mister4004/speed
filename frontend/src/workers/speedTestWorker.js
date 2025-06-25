self.onmessage = async (e) => {
  const { type, url, sizeMb } = e.data;

  try {
    if (type === 'download') {
      const startTime = performance.now();
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const blob = await response.blob();
      const endTime = performance.now();

      const durationSeconds = (endTime - startTime) / 1000;
      const fileSizeBits = blob.size * 8;
      const speedMbps = (fileSizeBits / durationSeconds) / 1000000;

      self.postMessage({ speedMbps });
    } else if (type === 'upload') {
      const uploadBufferSize = sizeMb * 1024 * 1024;
      const randomData = new Uint8Array(uploadBufferSize);
      crypto.getRandomValues(randomData);

      const startTime = performance.now();
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: randomData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const endTime = performance.now();

      const durationSeconds = (endTime - startTime) / 1000;
      const dataSentBits = uploadBufferSize * 8;
      const speedMbps = (dataSentBits / durationSeconds) / 1000000;

      self.postMessage({ speedMbps });
    }
  } catch (err) {
    self.postMessage({ error: err.message });
  }
};
