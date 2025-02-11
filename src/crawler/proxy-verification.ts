import * as https from 'https';
import axios from 'axios';
import { Logger } from '@nestjs/common';

const logger = new Logger('ProxyVerification');

export async function verifyProxy(ip: string, port: number): Promise<boolean> {
  const testUrl = 'https://httpbin.org/ip';
  const externalCheckUrl = `https://proxycheck.io/v2/${ip}`;
  const timeout = 5000;

  const detectProtocol = async (): Promise<'https' | 'http' | null> => {
    try {
      const [httpCheck, httpsCheck] = await Promise.allSettled([
        axios.get(`http://${ip}:${port}`, { timeout }),
        axios.get(testUrl, { proxy: { host: ip, port }, timeout })
      ]);

      if (httpCheck.status === 'fulfilled') return 'http';
      if (httpsCheck.status === 'fulfilled') return 'https';
    } catch {}

    return null;
  };

  const checkProxyTLS = async (minTLS: string, maxTLS: string): Promise<boolean> => {
    try {
      const httpsAgent = new https.Agent({ minVersion: minTLS as any, maxVersion: maxTLS as any, rejectUnauthorized: false });
      const response = await axios.get(testUrl, { proxy: { host: ip, port }, timeout, httpsAgent });
      return !!response.data?.origin;
    } catch {
      return false;
    }
  };

  const protocol = await detectProtocol();
  if (!protocol) return false;

  if (protocol === 'https') {
    if (await checkProxyTLS('TLSv1.3', 'TLSv1.3') || await checkProxyTLS('TLSv1.2', 'TLSv1.2')) {
      return true;
    }
  }

  try {
    const { data } = await axios.get(externalCheckUrl, { timeout });
    return data?.[ip]?.proxy === 'yes';
  } catch {
    return false;
  }
}
