// import axios from 'axios';
// import * as cheerio from 'cheerio';
// import { Logger } from '@nestjs/common';
// import { detectProxyType, detectProxyPort } from './vpn-proxy-check';
// import { getHeaders, randomDelay, extractSafeLinks, getCpuUsage, getMemoryUsage, handleResponse } from './humize-look';
// import { verifyProxy } from './proxy-verification';
// import { PrismaService } from '../../prisma/prismaService';
//
// /**
//  * This function is used for logging a message using the provided logger.
//  */
// export const logMessage = (logger: Logger, message: string) => {
//   logger.log(message);
// };
//
// /**
//  * This function is used for handling errors during the crawling process and logging the error message.
//  */
// export const handleCrawlerError = (logger: Logger, url: string, error: any) => {
//   logger.warn(`⚠️ Failed to crawl ${url}: ${error.message}`);
// };
//
// /**
//  * This function is used for crawling the provided URL, processing the response, extracting links, and proxies.
//  */
// export const crawlUrl = async (
//   url: string,
//   logger: Logger,
//   visitedUrls: Set<string>,
//   queue: string[],
//   maxConcurrentCrawlers: number,
//   currentQueueSize: number,
//   prisma: PrismaService
// ) => {
//   try {
//     logMessage(logger, `🔍 Crawling: ${url}`);
//     await randomDelay();
//     const response = await axios.get(url, { headers: getHeaders(), timeout: 10000 });
//     await handleResponse(response.status, url);
//
//     if (response.status !== 200) {
//       logger.warn(`⚠️ Skipping ${url}, received status ${response.status}`);
//       return;
//     }
//
//     const $ = cheerio.load(response.data);
//     extractSafeLinks($, url, visitedUrls, queue);
//     await extractProxies(response.data, url, prisma, logger);
//   } catch (error) {
//     handleCrawlerError(logger, url, error);
//   } finally {
//     currentQueueSize--;
//   }
// };
//
// /**
//  * This function is used for extracting proxy IPs from the HTML content and saving valid proxies to the database.
//  */
// export const extractProxies = async (html: string, source: string, prisma: PrismaService, logger: Logger) => {
//   const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
//   const foundIps = html.match(ipRegex);
//   if (!foundIps) return;
//
//   const proxyIpSet = new Set<string>();
//   for (const ip of foundIps) {
//     if (!proxyIpSet.has(ip)) {
//       proxyIpSet.add(ip);
//       const proxyType = await detectProxyType(ip, source);
//       const port = await detectProxyPort(ip);
//       if (port) {
//         const verified = await verifyProxy(ip, port);
//         if (verified) {
//           await saveProxyIp(ip, proxyType, source, port, prisma, logger);
//         }
//       }
//     }
//   }
// };
//
// /**
//  * This function is used for saving a valid proxy IP to the database.
//  */
// export const saveProxyIp = async (ip: string, type: string, source: string, port: number, prisma: PrismaService, logger: Logger) => {
//   try {
//     await prisma.aggregatedProxy2.upsert({
//       where: { ip },
//       update: { lastSeen: new Date(), port, type },
//       create: { ip, type, source, port, firstSeen: new Date() },
//     });
//     logMessage(logger, `✅ Proxy IP saved: ${ip} (Type: ${type}, Port: ${port}, Source: ${source})`);
//   } catch (error) {
//     logger.error(`❌ Failed to save proxy IP ${ip}: ${error.message}`);
//   }
// };
//
// /**
//  * This function is used for adjusting the number of concurrent crawlers based on the queue length and system resources.
//  */
// export const adjustCrawlers = (
//   queueLength: number,
//   activeCrawlers: number,
//   cpuUsage: number,
//   memoryUsage: number,
//   maxConcurrentCrawlers: number
// ) => {
//   if (queueLength > 100 && activeCrawlers < 50 && cpuUsage < 80 && memoryUsage < 80) {
//     return Math.min(activeCrawlers + 5, 50);
//   } else if (queueLength < 20 || cpuUsage > 90 || memoryUsage > 90) {
//     return Math.max(activeCrawlers - 3, 5);
//   }
//   return maxConcurrentCrawlers;
// };
//
// /**
//  * This function is used for fetching the current CPU usage percentage.
//  */
// export const getCpuUsage = () => {
//   // Placeholder function to return CPU usage percentage.
//   return 70; // Example value
// };
//
// /**
//  * This function is used for fetching the current memory usage percentage.
//  */
// export const getMemoryUsage = () => {
//   // Placeholder function to return memory usage percentage.
//   return 60; // Example value
// };
//
// /**
//  * This function is used for handling HTTP response codes during the crawling process.
//  */
// export const handleResponse = async (status: number, url: string) => {
//   if (status !== 200) {
//     console.log(`⚠️ Skipping ${url}, received status ${status}`);
//   }
// };
//
// /**
//  * This function is used for simulating a random delay between crawling requests.
//  */
// export const randomDelay = async () => {
//   const delay = Math.floor(Math.random() * 3000) + 1000; // Delay between 1-4 seconds
//   return new Promise(resolve => setTimeout(resolve, delay));
// };
//
// /**
//  * This function is used for extracting safe links from the HTML content.
//  */
// export const extractSafeLinks = ($: cheerio.CheerioAPI, url: string, visitedUrls: Set<string>, queue: string[]) => {
//   $('a').each((_, element) => {
//     const link = $(element).attr('href');
//     if (link && !visitedUrls.has(link)) {
//       visitedUrls.add(link);
//       queue.push(link);
//     }
//   });
// };
