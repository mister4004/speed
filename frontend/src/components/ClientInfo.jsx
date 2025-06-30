import React, { useState, useEffect } from 'react';

const ClientInfo = () => {
  const [ipInfo, setIpInfo] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [localIp, setLocalIp] = useState(null);
  const [loadingClientInfo, setLoadingClientInfo] = useState(true);
  const [loadingLocalIp, setLoadingLocalIp] = useState(false);
  const [errorClientInfo, setErrorClientInfo] = useState(null);
  const [errorLocalIp, setErrorLocalIp] = useState(null);
  const [sessionId] = useState(Date.now().toString(36) + Math.random().toString(36).substr(2));

  // Function to find local IP using WebRTC
  const findLocalIp = () => {
    return new Promise((resolve, reject) => {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('');

      pc.onicecandidate = (event) => {
        if (event.candidate && event.candidate.candidate) {
          const candidateStr = event.candidate.candidate;
          const ipMatch = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(
            candidateStr
          );
          if (ipMatch) {
            const ipAddress = ipMatch[0];
            // Check for private IP ranges
            if (
              ipAddress.startsWith('192.168.') ||
              ipAddress.startsWith('10.') ||
              ipAddress.startsWith('172.16.')
            ) {
              pc.onicecandidate = null; // Stop listening for candidates
              pc.close(); // Close the peer connection
              resolve(ipAddress); // Resolve with the local IP
              return;
            }
          }
        } else if (event.candidate === null) {
          // All ICE candidates have been gathered
          pc.onicecandidate = null;
          pc.close();
          reject(
            new Error(
              'Could not find local IP. WebRTC may be disabled or blocked by VPN/Proxy.'
            )
          );
        }
      };

      // Create an offer to start the ICE gathering process
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch((err) => {
          pc.close();
          reject(new Error(`Error creating WebRTC offer: ${err.message}`));
        });

      // Timeout to prevent infinite loading if no candidate is found
      setTimeout(() => {
        if (pc.iceConnectionState !== 'closed' && pc.iceConnectionState !== 'disconnected') {
          pc.close();
          reject(new Error('WebRTC Local IP discovery timed out.'));
        }
      }, 5000);
    });
  };

  // Save client info to server
  const saveClientInfo = async (data) => {
    try {
      await fetch('/api/v1/save-client-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          timestamp: new Date().toISOString(),
          ...data
        })
      });
    } catch (error) {
      console.error('Error saving client info:', error);
    }
  };

  // useEffect hook to load client and local IP information on component mount
  useEffect(() => {
    const loadInitialClientInfo = async () => {
      try {
        setLoadingClientInfo(true);
        setErrorClientInfo(null);

        // Function to fetch geolocation data exclusively from ipinfo.io
        const fetchGeolocation = async () => {
          try {
            const response = await fetch("https://ipinfo.io/json");

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Failed to fetch from ipinfo.io: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            // ipinfo.io returns an "ip" field on success
            if (data.ip) {
              return data;
            }
            // If ip field is not present, it's an API-level error from ipinfo.io
            throw new Error(`ipinfo.io error: ${data.error?.message || 'Unknown error'}`);

          } catch (error) {
            console.error('Geolocation API error:', error);
            throw new Error(`Geolocation API error: ${error.message}`);
          }
        };

        const ipData = await fetchGeolocation();

        // Process the data from ipinfo.io
        if (!ipData || !ipData.ip) {
            throw new Error('Failed to get geolocation data from ipinfo.io.');
        }

        const [lat, lon] = ipData.loc ? ipData.loc.split(',') : [0, 0];

        const geoData = {
            ip: ipData.ip,
            country: ipData.country,
            city: ipData.city,
            region: ipData.region,
            timezone: ipData.timezone,
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            isp: ipData.org, // ipinfo.io uses 'org' for ISP/Organization
            org: ipData.org,
            as: ipData.asn, // ipinfo.io uses 'asn' for AS
            proxy: ipData.country === 'A1' ? true : false, // Placeholder, ipinfo.io may not directly indicate proxy
            mobile: false, // Placeholder, ipinfo.io may not directly indicate mobile
            hosting: false, // Placeholder, ipinfo.io may not directly indicate hosting
            zip: ipData.postal,
        };

        setIpInfo(geoData);

        // Set device information
        const deviceData = {
          browser:
            navigator.userAgent.match(/(Chrome|Firefox|Safari|Opera|Edge|MSIE)\/?\s*(\d+\.\d+)/i)?.[1] ||
            'Unknown',
          os: navigator.platform || 'Unknown',
          deviceType:
            'ontouchstart' in window || navigator.maxTouchPoints > 0 ? 'Mobile/Tablet' : 'Desktop',
          userAgent: navigator.userAgent,
          resolution: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language,
          webGL: (function () {
            try {
              return !!document.createElement('canvas').getContext('webgl');
            } catch (e) {
              return false;
            }
          })(),
          webRTC: typeof RTCPeerConnection !== 'undefined',
          cookiesEnabled: navigator.cookieEnabled,
          javaEnabled: navigator.javaEnabled(),
        };

        setDeviceInfo(deviceData);

        // Save collected data to server
        saveClientInfo({
          ipInfo: geoData,
          deviceInfo: deviceData
        });

      } catch (err) {
        setErrorClientInfo(err.message);
      } finally {
        setLoadingClientInfo(false);
      }
    };

    // Load local IP information
    const loadLocalIpInfo = async () => {
      setLoadingLocalIp(true);
      setErrorLocalIp(null);
      try {
        const ip = await findLocalIp();
        setLocalIp(ip);
        
        // Update saved data with local IP
        saveClientInfo({
          localIp: ip
        });
      } catch (err) {
        setErrorLocalIp(err.message);
        
        // Save error information
        saveClientInfo({
          localIpError: err.message
        });
      } finally {
        setLoadingLocalIp(false);
      }
    };

    loadInitialClientInfo();
    loadLocalIpInfo();
  }, [sessionId]); // Dependency on sessionId ensures this runs once per session

  // Spinner component for loading states
  const Spinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <section className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-blue-600 mb-4 text-center">
        Your Connection & Device Information
      </h2>
      {loadingClientInfo ? (
        <Spinner />
      ) : errorClientInfo ? (
        <p className="text-red-500 text-center">
          Error: {errorClientInfo}. Please check your connection or try again later.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-md shadow-sm">
            <h3 className="text-xl font-medium text-blue-800 mb-2">Your Public IP & Geolocation</h3>
            {ipInfo && (
              <div className="space-y-1 text-gray-700 text-sm">
                <p>
                  <strong>IP:</strong> {ipInfo.ip}
                </p>
                <p>
                  <strong>Country:</strong> {ipInfo.country}
                </p>
                <p>
                  <strong>Region:</strong> {ipInfo.region}
                </p>
                <p>
                  <strong>City:</strong> {ipInfo.city}
                </p>
                <p>
                  <strong>Timezone:</strong> {ipInfo.timezone}
                </p>
                <p>
                  <strong>Provider (ISP):</strong> {ipInfo.isp}
                </p>
                <p>
                  <strong>Organization:</strong> {ipInfo.org}
                </p>
                <p>
                  <strong>Autonomous System (AS):</strong> {ipInfo.as}
                </p>
                {ipInfo.proxy && (
                  <p className="text-orange-600">
                    <strong>Proxy/VPN Used:</strong> Yes
                  </p>
                )}
                {ipInfo.mobile && (
                  <p className="text-orange-600">
                    <strong>Mobile Connection:</strong> Yes
                  </p>
                )}
                {ipInfo.hosting && (
                  <p className="text-orange-600">
                    <strong>Hosting/Datacenter:</strong> Yes
                  </p>
                )}
                <p>
                  <strong>Coordinates:</strong> {ipInfo.lat}, {ipInfo.lon}
                </p>
                <p>
                  <strong>Zip Code:</strong> {ipInfo.zip}
                </p>
              </div>
            )}
          </div>
          <div className="bg-green-50 p-4 rounded-md shadow-sm">
            <h3 className="text-xl font-medium text-green-800 mb-2">Your Device Information</h3>
            {deviceInfo && (
              <div className="space-y-1 text-gray-700 text-sm">
                <p>
                  <strong>Browser:</strong> {deviceInfo.browser}
                </p>
                <p>
                  <strong>OS:</strong> {deviceInfo.os}
                </p>
                <p>
                  <strong>Device Type:</strong> {deviceInfo.deviceType}
                </p>
                <p>
                  <strong>Screen Resolution:</strong> {deviceInfo.resolution}
                </p>
                <p>
                  <strong>Browser Language:</strong> {deviceInfo.language}
                </p>
                <p>
                  <strong>WebGL Support:</strong> {deviceInfo.webGL ? 'Yes' : 'No'}
                </p>
                <p>
                  <strong>WebRTC Support:</strong> {deviceInfo.webRTC ? 'Yes' : 'No'}
                </p>
                <p>
                  <strong>Cookies Enabled:</strong> {deviceInfo.cookiesEnabled ? 'Yes' : 'No'}
                </p>
                <p>
                  <strong>Java Enabled:</strong> {deviceInfo.javaEnabled ? 'Yes' : 'No'}
                </p>
                <p className="font-semibold mt-2">Full User-Agent:</p>
                <span className="break-all text-xs bg-gray-100 p-1 rounded">
                  {deviceInfo.userAgent}
                </span>
              </div>
            )}
            <h3 className="text-xl font-medium text-green-800 mb-2 mt-4">
              Local IP (WebRTC)
            </h3>
            {loadingLocalIp ? (
              <Spinner />
            ) : errorLocalIp ? (
              <p className="text-red-500">
                Error: {errorLocalIp}
                <br />
                <span className="text-xs text-gray-500">
                  WebRTC might be disabled in your browser or blocked by VPN/Proxy. Check
                  browser settings or try disabling your VPN.
                </span>
              </p>
            ) : (
              <p className="text-gray-700 text-sm">
                <strong>Local IP:</strong>{' '}
                {localIp || 'Undefined (may be hidden by VPN/Proxy or no WebRTC support)'}
                <br />
                <span className="text-xs text-gray-500">
                  If your public IP differs from your local IP, this might indicate a leak.
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default ClientInfo;
