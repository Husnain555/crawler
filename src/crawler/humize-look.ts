import * as os from "os";
import * as cheerio from "cheerio";
import { URL } from "url";
import * as tough from 'tough-cookie';
import axios from "axios";
import * as axiosCookieJarSupport from "axios-cookiejar-support";

axiosCookieJarSupport.wrapper(axios);
export const cookieJar = new tough.CookieJar();

const userAgents: string[] = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/15.2 Mobile/15E148 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/37.0.2062.94 Chrome/37.0.2062.94 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36",
  "Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko",
  "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/600.8.9 (KHTML, like Gecko) Version/8.0.8 Safari/600.8.9",
  "Mozilla/5.0 (iPad; CPU OS 8_4_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12H321 Safari/600.1.4",
  "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.85 Safari/537.36",
];

export const getRandomUserAgent = (): string => userAgents[Math.floor(Math.random() * userAgents.length)];

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const randomDelay = async () => await sleep(Math.random() * 3000 + 2000);

export const getHeaders = () => ({
  "User-Agent": getRandomUserAgent(),
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Referer": "https://www.google.com/",
  "DNT": "1",
});

export const extractSafeLinks = ($: cheerio.CheerioAPI, baseUrl: string, visitedUrls: Set<string>, queue: string[]) => {
  $("a").each((_, el) => {
    if ($(el).css("display") === "none" || $(el).attr("rel") === "nofollow") return;
    const href = $(el).attr("href");
    if (!href) return;
    const absoluteUrl = new URL(href, baseUrl).href;
    if (!visitedUrls.has(absoluteUrl) && !queue.includes(absoluteUrl)) {
      queue.push(absoluteUrl);
    }
  });
};

export const getCpuUsage = (): number => {
  const cpus = os.cpus();
  let totalLoad = 0;
  cpus.forEach(cpu => {
    const { user, nice, sys, idle } = cpu.times;
    const total = user + nice + sys + idle;
    totalLoad += (total - idle) / total;
  });
  return (totalLoad / cpus.length) * 100;
};

export const getMemoryUsage = (): number => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  return ((totalMem - freeMem) / totalMem) * 100;
};

export const handleResponse = async (status: number, url: string) => {
  if (status === 403 || status === 429) {
    console.warn(`Blocked! Waiting before retrying ${url}...`);
    await sleep(10000);
  }
};
