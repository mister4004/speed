import React, { useState } from 'react';
import api from "../utils/api";

const HttpPing = () => {
  const [latency, setLatency] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const measureHttpPing = async () => {
    setLoading(true);
    setError(null);
    setLatency(null);

    try {
      // Perform 3 measurements for accuracy
      const measurements = [];
      for (let i = 0; i < 3; i++) {
        const startTime = performance.now();
        // Fixed: using getHealth method from api
        await api.getHealth();
        const endTime = performance.now();
        measurements.push(endTime - startTime);
        // Delay between measurements
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      // Calculate average latency
      const avgLatency = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
      setLatency(avgLatency.toFixed(2));
    } catch (err) {
      setError(err.message || 'Error measuring latency.');
    } finally {
      setLoading(false);
    }
  };

  const Spinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
    </div>
  );

  return (
    <section className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-orange-600 mb-4 text-center">
        Server Latency Test (HTTP Ping)
      </h2>
      <p className="text-sm text-gray-600 mb-3 text-center">
        Measures the time it takes for your browser to send a request and receive a response from
        the diagnostic server.
      </p>
      <button
        onClick={measureHttpPing}
        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out flex items-center justify-center"
        disabled={loading}
      >
        {loading ? <Spinner /> : 'Measure Server Latency'}
      </button>
      {error && (
        <p className="text-red-500 mt-2 text-center">
          Error: {error}. Please check your connection or try again later.
        </p>
      )}
      {latency && (
        <p className="text-center mt-2">
          Average Server Latency: <strong>{latency} ms</strong>
        </p>
      )}
    </section>
  );
};

export default HttpPing;
