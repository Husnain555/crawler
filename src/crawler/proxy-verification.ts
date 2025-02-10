import * as https from 'https';
import axios from 'axios';
import { Logger } from '@nestjs/common';

const logger = new Logger('ProxyVerification');

export async function verifyProxy(ip: string, port: number): Promise<boolean> {
  const testUrl = 'https://httpbin.org/ip';
  const httpTestUrl = 'http://httpbin.org/ip';
  const externalCheckUrl = `https://proxycheck.io/v2/${ip}`;
  const maxRetries = 3;

  const detectProtocol = async (): Promise<'https' | 'http' | null> => {
    try {
      const response = await axios.get(httpTestUrl, { proxy: { host: ip, port }, timeout: 5000 });
      return response.data ? 'http' : null;
    } catch {
      try {
        const response = await axios.get(testUrl, { proxy: { host: ip, port }, timeout: 5000 });
        return response.data ? 'https' : null;
      } catch {
        return null;
      }
    }
  };

  const checkProxyTLS = async (url: string, minTLS: string, maxTLS: string): Promise<boolean> => {
    try {
      const httpsAgent = new https.Agent({ minVersion: minTLS as any, maxVersion: maxTLS as any, rejectUnauthorized: false });
      const response = await axios.get(url, { proxy: { host: ip, port }, timeout: 5000, httpsAgent });
      return !!response.data?.origin;
    } catch (error) {
      if (error.message.includes('certificate has expired')) {
        logger.warn(`Proxy ${ip}:${port} has an expired certificate but may still work.`);
        return true;
      }
      logger.warn(`Proxy ${ip}:${port} TLS ${minTLS}-${maxTLS} failed: ${error.message}`);
    }
    return false;
  };

  const protocol = await detectProtocol();
  if (!protocol) {
    logger.warn(`❌ Proxy ${ip}:${port} is unreachable via HTTP & HTTPS.`);
    return false;
  }

  if (protocol === 'https') {
    for (let i = 0; i < maxRetries; i++) {
      if (await checkProxyTLS(testUrl, 'TLSv1.3', 'TLSv1.3') || await checkProxyTLS(testUrl, 'TLSv1.2', 'TLSv1.2')) {
        return true;
      }
    }
  }

  try {
    const externalResponse = await axios.get(externalCheckUrl, { timeout: 5000 });
    if (externalResponse.data?.[ip]?.proxy === 'yes') {
      logger.log(`✅ Proxy ${ip}:${port} confirmed via external check.`);
      return true;
    }
  } catch (error) {
    logger.warn(`External check failed for ${ip}: ${error.message}`);
  }

  logger.warn(`❌ Proxy ${ip}:${port} failed ALL verification checks.`);
  return false;
}
