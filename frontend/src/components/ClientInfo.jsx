import React, { useState, useEffect } from 'react';

const ClientInfo = () => {
  const [ipInfo, setIpInfo] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({});
  const [localIp, setLocalIp] = useState(null);
  const [loadingClientInfo, setLoadingClientInfo] = useState(true);
  const [loadingLocalIp, setLoadingLocalIp] = useState(false);
  const [errorClientInfo, setErrorClientInfo] = useState(null);
  const [errorLocalIp, setErrorLocalIp] = useState(null);

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
            if (
              ipAddress.startsWith('192.168.') ||
              ipAddress.startsWith('10.') ||
              ipAddress.startsWith('172.16.')
            ) {
              pc.onicecandidate = null;
              pc.close();
              resolve(ipAddress);
              return;
            }
          }
        } else if (event.candidate === null) {
          pc.onicecandidate = null;
          pc.close();
          reject(
            new Error(
              'Could not find local IP. WebRTC may be disabled or blocked by VPN/Proxy.'
            )
          );
        }
      };

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch((err) => {
          pc.close();
          reject(new Error(`Error creating WebRTC offer: ${err.message}`));
        });

      setTimeout(() => {
        if (pc.iceConnectionState !== 'closed' && pc.iceConnectionState !== 'disconnected') {
          pc.close();
          reject(new Error('WebRTC Local IP discovery timed out.'));
        }
      }, 5000);
    });
  };

  useEffect(() => {
    const loadInitialClientInfo = async () => {
      try {
        setLoadingClientInfo(true);
        setErrorClientInfo(null);

        const ipApiRes = await fetch('http://ip-api.com/json');
        if (!ipApiRes.ok) {
          throw new Error(`IP API error: ${ipApiRes.status}`);
        }
        const ipData = await ipApiRes.json();
        setIpInfo({
          ip: ipData.query,
          country: ipData.country,
          city: ipData.city,
          region: ipData.regionName,
          timezone: ipData.timezone,
          lat: ipData.lat,
          lon: ipData.lon,
          isp: ipData.isp,
          org: ipData.org,
          as: ipData.as,
          proxy: ipData.proxy,
          mobile: ipData.mobile,
          hosting: ipData.hosting,
          zip: ipData.zip,
        });

        setDeviceInfo({
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
        });
      } catch (err) {
        setErrorClientInfo(err.message);
      } finally {
        setLoadingClientInfo(false);
      }
    };

    const loadLocalIpInfo = async () => {
      setLoadingLocalIp(true);
      setErrorLocalIp(null);
      try {
        const ip = await findLocalIp();
        setLocalIp(ip);
      } catch (err) {
        setErrorLocalIp(err.message);
      } finally {
        setLoadingLocalIp(false);
      }
    };

    loadInitialClientInfo();
    loadLocalIpInfo();
  }, []);

  const Spinner = () => (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <section className="bg-gray-50 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-blue-600 mb-4 text-center">
        Информация о Вашем Соединении и Устройстве
      </h2>
      {loadingClientInfo ? (
        <Spinner />
      ) : errorClientInfo ? (
        <p className="text-red-500 text-center">
          Ошибка: {errorClientInfo}. Проверьте соединение или попробуйте позже.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-md shadow-sm">
            <h3 className="text-xl font-medium text-blue-800 mb-2">Ваш Публичный IP и Геолокация</h3>
            {ipInfo && (
              <div className="space-y-1 text-gray-700 text-sm">
                <p>
                  <strong>IP:</strong> {ipInfo.ip}
                </p>
                <p>
                  <strong>Страна:</strong> {ipInfo.country}
                </p>
                <p>
                  <strong>Регион:</strong> {ipInfo.region}
                </p>
                <p>
                  <strong>Город:</strong> {ipInfo.city}
                </p>
                <p>
                  <strong>Часовой пояс:</strong> {ipInfo.timezone}
                </p>
                <p>
                  <strong>Провайдер (ISP):</strong> {ipInfo.isp}
                </p>
                <p>
                  <strong>Организация:</strong> {ipInfo.org}
                </p>
                <p>
                  <strong>Автономная система (AS):</strong> {ipInfo.as}
                </p>
                {ipInfo.proxy && (
                  <p className="text-orange-600">
                    <strong>Используется прокси/VPN:</strong> Да
                  </p>
                )}
                {ipInfo.mobile && (
                  <p className="text-orange-600">
                    <strong>Мобильное соединение:</strong> Да
                  </p>
                )}
                {ipInfo.hosting && (
                  <p className="text-orange-600">
                    <strong>Хостинг/ЦОД:</strong> Да
                  </p>
                )}
                <p>
                  <strong>Координаты:</strong> {ipInfo.lat}, {ipInfo.lon}
                </p>
                <p>
                  <strong>Индекс:</strong> {ipInfo.zip}
                </p>
              </div>
            )}
          </div>
          <div className="bg-green-50 p-4 rounded-md shadow-sm">
            <h3 className="text-xl font-medium text-green-800 mb-2">Информация о Вашем Устройстве</h3>
            {deviceInfo && (
              <div className="space-y-1 text-gray-700 text-sm">
                <p>
                  <strong>Браузер:</strong> {deviceInfo.browser}
                </p>
                <p>
                  <strong>ОС:</strong> {deviceInfo.os}
                </p>
                <p>
                  <strong>Тип устройства:</strong> {deviceInfo.deviceType}
                </p>
                <p>
                  <strong>Разрешение экрана:</strong> {deviceInfo.resolution}
                </p>
                <p>
                  <strong>Язык браузера:</strong> {deviceInfo.language}
                </p>
                <p>
                  <strong>Поддержка WebGL:</strong> {deviceInfo.webGL ? 'Да' : 'Нет'}
                </p>
                <p>
                  <strong>Поддержка WebRTC:</strong> {deviceInfo.webRTC ? 'Да' : 'Нет'}
                </p>
                <p>
                  <strong>Cookies включены:</strong> {deviceInfo.cookiesEnabled ? 'Да' : 'Нет'}
                </p>
                <p>
                  <strong>Java включена:</strong> {deviceInfo.javaEnabled ? 'Да' : 'Нет'}
                </p>
                <p className="font-semibold mt-2">Полный User-Agent:</p>
                <span className="break-all text-xs bg-gray-100 p-1 rounded">
                  {deviceInfo.userAgent}
                </span>
              </div>
            )}
            <h3 className="text-xl font-medium text-green-800 mb-2 mt-4">
              Локальный IP (WebRTC)
            </h3>
            {loadingLocalIp ? (
              <Spinner />
            ) : errorLocalIp ? (
              <p className="text-red-500">
                Ошибка: {errorLocalIp}
                <br />
                <span className="text-xs text-gray-500">
                  WebRTC может быть отключен в браузере или блокирован VPN/Proxy. Проверьте
                  настройки браузера или попробуйте отключить VPN.
                </span>
              </p>
            ) : (
              <p className="text-gray-700 text-sm">
                <strong>Локальный IP:</strong>{' '}
                {localIp || 'Не определен (может быть скрыт VPN/Proxy или нет поддержки WebRTC)'}
                <br />
                <span className="text-xs text-gray-500">
                  Если ваш публичный IP отличается от локального IP, это может указывать на
                  утечку.
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
