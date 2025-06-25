import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Charts = ({ results }) => {
  const pingData = results.icmpPing?.responses?.map((response, index) => ({
    name: `Ping ${index + 1}`,
    time: response.time,
  })) || [];

  const speedData = results.speedTest
    ? [
        { name: 'Download', speed: results.speedTest.downloadSpeed || 0 },
        { name: 'Upload', speed: results.speedTest.uploadSpeed || 0 },
      ]
    : [];

  return (
    <div className="charts">
      <h2>Network Performance Charts</h2>
      {pingData.length > 0 && (
        <div>
          <h3>Ping Response Times</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={pingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="time" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {speedData.length > 0 && (
        <div>
          <h3>Speed Test</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={speedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'Speed (Mbps)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="speed" stroke="#82ca9d" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {!pingData.length && !speedData.length && <p>No data available for charts.</p>}
    </div>
  );
};

export default Charts;
