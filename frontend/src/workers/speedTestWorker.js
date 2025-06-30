// frontend/src/workers/speedTestWorker.js

// Вспомогательная функция для генерации данных для загрузки
const generateUploadData = (sizeMb) => {
    const buffer = new ArrayBuffer(sizeMb * 1024 * 1024);
    // Можно заполнить случайными данными для лучшего теста
    // new Uint8Array(buffer).forEach((_, i) => new Uint8Array(buffer)[i] = Math.floor(Math.random() * 256));
    return buffer;
};

// Функция для выполнения HTTP-пинга
const runPingTest = async (pingUrl, numPings = 5) => {
    let totalLatency = 0;
    const latencies = [];
    for (let i = 0; i < numPings; i++) {
        const startTime = performance.now();
        try {
            const response = await fetch(pingUrl);
            if (!response.ok) {
                throw new Error(`Ping failed: ${response.statusText}`);
            }
            const endTime = performance.now();
            const latency = endTime - startTime;
            latencies.push(latency);
            totalLatency += latency;
            self.postMessage({ type: 'progress', phase: 'ping', current: i + 1, total: numPings, latency: latency.toFixed(2) });
        } catch (error) {
            console.error('Ping test error:', error);
            self.postMessage({ type: 'error', phase: 'ping', message: error.message });
            latencies.push(Infinity); // Если пинг не удался
        }
    }
    const averageLatency = latencies.filter(l => l !== Infinity).reduce((sum, l) => sum + l, 0) / latencies.length;
    return isNaN(averageLatency) ? Infinity : averageLatency;
};


// Функция для выполнения теста загрузки
const runDownloadTest = async (downloadUrl, sizeMb, parallelStreams) => {
    let totalDownloadedBytes = 0;
    const downloadPromises = [];
    const chunkSizeMb = sizeMb / parallelStreams; // Размер данных для каждого потока

    self.postMessage({ type: 'status', message: 'Starting download test...' });
    const downloadStartTime = performance.now();

    for (let i = 0; i < parallelStreams; i++) {
        downloadPromises.push(
            fetch(`${downloadUrl}?size=${chunkSizeMb}`, { cache: 'no-store' }) // Отключаем кэш для точности
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Download stream ${i+1} failed: ${response.statusText}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    totalDownloadedBytes += blob.size;
                    self.postMessage({ type: 'progress', phase: 'download', current: i + 1, total: parallelStreams, downloadedBytes: totalDownloadedBytes });
                })
        );
    }

    await Promise.all(downloadPromises);
    const downloadEndTime = performance.now();
    const downloadDurationSec = (downloadEndTime - downloadStartTime) / 1000;
    const downloadSpeedMbps = (totalDownloadedBytes * 8) / (downloadDurationSec * 1000 * 1000); // Bytes to Megabits

    return { totalDownloadedBytes, downloadDurationSec, downloadSpeedMbps };
};

// Функция для выполнения теста выгрузки
const runUploadTest = async (uploadUrl, sizeMb, parallelStreams) => {
    let totalUploadedBytes = 0;
    const uploadPromises = [];
    const uploadData = generateUploadData(sizeMb); // Генерируем данные один раз
    const chunkSize = Math.floor(uploadData.byteLength / parallelStreams);

    self.postMessage({ type: 'status', message: 'Starting upload test...' });
    const uploadStartTime = performance.now();

    for (let i = 0; i < parallelStreams; i++) {
        const chunk = uploadData.slice(i * chunkSize, (i + 1) * chunkSize);
        uploadPromises.push(
            fetch(uploadUrl, {
                method: 'POST',
                body: chunk,
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Cache-Control': 'no-store', // Отключаем кэш
                },
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Upload stream ${i+1} failed: ${response.statusText}`);
                }
                totalUploadedBytes += chunk.byteLength;
                self.postMessage({ type: 'progress', phase: 'upload', current: i + 1, total: parallelStreams, uploadedBytes: totalUploadedBytes });
                return response.json();
            })
        );
    }

    await Promise.all(uploadPromises);
    const uploadEndTime = performance.now();
    const uploadDurationSec = (uploadEndTime - uploadStartTime) / 1000;
    const uploadSpeedMbps = (totalUploadedBytes * 8) / (uploadDurationSec * 1000 * 1000); // Bytes to Megabits

    return { totalUploadedBytes, uploadDurationSec, uploadSpeedMbps };
};


// Основной обработчик сообщений для воркера
self.onmessage = async (event) => {
    const { type, payload } = event.data;

    if (type === 'startTest') {
        const { speedTestSizeMb, parallelStreams } = payload;
        const pingUrl = '/api/v1/speedtest/ping'; // Используем эндпоинт пинга из бэкенда
        const downloadUrl = '/api/v1/speedtest/download';
        const uploadUrl = '/api/v1/speedtest/upload';

        try {
            self.postMessage({ type: 'status', message: 'Running ping test...' });
            const pingLatency = await runPingTest(pingUrl);
            self.postMessage({ type: 'result', phase: 'ping', value: pingLatency.toFixed(2), unit: 'ms' });

            const downloadResults = await runDownloadTest(downloadUrl, speedTestSizeMb, parallelStreams);
            self.postMessage({
                type: 'result',
                phase: 'download',
                value: downloadResults.downloadSpeedMbps.toFixed(2),
                unit: 'Mbps',
                debug: {
                    totalBytes: downloadResults.totalDownloadedBytes,
                    duration: downloadResults.downloadDurationSec,
                }
            });

            const uploadResults = await runUploadTest(uploadUrl, speedTestSizeMb, parallelStreams);
            self.postMessage({
                type: 'result',
                phase: 'upload',
                value: uploadResults.uploadSpeedMbps.toFixed(2),
                unit: 'Mbps',
                debug: {
                    totalBytes: uploadResults.totalUploadedBytes,
                    duration: uploadResults.uploadDurationSec,
                }
            });

            self.postMessage({ type: 'completed' });
        } catch (error) {
            console.error('Speed test worker error:', error);
            self.postMessage({ type: 'error', message: error.message });
        }
    }
};
