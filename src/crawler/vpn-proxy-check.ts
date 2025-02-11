import * as net from 'net';
import axios from 'axios';

export async function detectProxyType(ip: string, source: string): Promise<string> {
  if (source.includes('torproject.org')) return 'tor';

  const vpnDetection = await isVpn(ip);
  if (vpnDetection) return 'vpn';

  return 'proxy';
}

export async function detectProxyPort(ip: string, openProxyPorts: number[]): Promise<number | null> {
  try {
    const results = await Promise.all(openProxyPorts.map((port) => scanPort(ip, port)));
    const openPortIndex = results.findIndex((isOpen) => isOpen);

    return openPortIndex !== -1 ? openProxyPorts[openPortIndex] : null;
  } catch (error) {
    console.error(`Error detecting proxy port for ${ip}:`, error.message);
    return null;
  }
}

export async function scanPort(ip: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);

    socket.connect(port, ip, () => {
      socket.destroy();
      resolve(true);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

export async function isVpn(ip: string): Promise<boolean> {
  try {
    const [proxyCheck, ipApiCheck] = await Promise.all([
      axios.get(`https://proxycheck.io/v2/${ip}?vpn=1&asn=1`, { timeout: 5000 }),
      axios.get(`http://ip-api.com/json/${ip}?fields=proxy,hosting,org`, { timeout: 5000 })
    ]);

    const proxyCheckData = proxyCheck.data?.[ip];
    const ipApiData = ipApiCheck.data;

    return (
      proxyCheckData?.proxy === 'yes' ||
      proxyCheckData?.vpn === 'yes' ||
      ipApiData?.proxy === true ||
      ipApiData?.hosting === true
    );
  } catch (error) {
    console.warn(`VPN check failed for ${ip}:`, error.message);
    return false;
  }
}
