import * as net from 'net';

export async function detectProxyType(ip: string, source: string): Promise<string> {
  return source.includes('torproject.org') ? 'tor' : 'proxy';
}

export async function detectProxyPort(ip: string, openProxyPorts: number[]): Promise<number | null> {
  try {
    for (const port of openProxyPorts) {
      const isOpen = await scanPort(ip, port);
      if (isOpen) {
        return port;
      }
    }
  } catch (error) {
    return null;
  }
  return null;
}

export async function scanPort(ip: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);
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
