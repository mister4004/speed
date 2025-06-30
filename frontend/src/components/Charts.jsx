import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Charts = ({ results }) => {
  // Removed pingData as ICMP Ping test is no longer present
  // const pingData = results.icmpPing?.responses?.map((response, index) => ({
  //   name: `Ping ${index + 1}`,
  //   time: response.time,
  // })) || [];

  const speedData = results.speedTest
    ? [
        { name: 'Download', speed: results.speedTest.downloadSpeed || 0 },
        { name: 'Upload', speed: results.speedTest.uploadSpeed || 0 },
      ]
    : [];

  return (
    <section className="bg-gray-50 p-6 rounded-lg shadow-md"> {/* Changed div to section for consistency */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Network Performance Charts</h2> {/* Adjusted text color and margins for consistency */}
      
      {/* Removed Ping Response Times chart */}
      {/* {pingData.length > 0 && (
        <div>
          <h3 className="text-xl font-medium text-gray-700 mb-2 text-center">Ping Response Times</h3>
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
      )} */}
      
      {speedData.length > 0 && (
        <div>
          <h3 className="text-xl font-medium text-gray-700 mb-2 text-center">Speed Test Results</h3> {/* Changed title */}
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
      
      {/* Check if both pingData and speedData are empty */}
      {speedData.length === 0 && <p className="text-center text-gray-600 mt-4">No data available for charts.</p>}
    </section>
  );
};

export default Charts;
