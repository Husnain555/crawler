import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialEndpoints = [
  'https://www.ipdeny.com/ipblocks/',
  'https://www.free-proxy-list.net/',
  'https://www.proxynova.com/proxy-server-list/',
  'https://www.sslproxies.org/',
  'https://www.us-proxy.org/',
  'https://www.socks-proxy.net/',
  'https://spys.one/en/free-proxy-list/',
  'https://hidemy.name/en/proxy-list/',
  'https://www.xroxy.com/proxylist.htm',
  'https://www.nirsoft.net/countryip/',
  'https://www.my-proxy.com/free-proxy-list.html',
  'https://www.cool-proxy.net/',
  'https://proxydb.net/',
  'https://www.proxylists.net/',
  'https://openproxy.space/list',
  'https://www.wikipedia.org/',
  'https://www.torproject.org/',
  'https://www.zeit.de/',
  'https://www.bbc.com/',
  'https://www.reddit.com/',
  'https://www.vonage.com/',
  'https://www.wired.com/',
  'https://www.nytimes.com/',
  'https://www.cnn.com/',
  'https://www.theguardian.com/',
  'https://www.wikileaks.org/',
];

const initialProxyPorts = [
  80, 443, 8000, 8080, 8081, 8088, 8090, 8888, 8443, 3128, 9999, 3838, 9080, 8118, 8181, 8899, 9000, 9443,
  1080, 1081, 1082, 1083, 1084, 1085, 1086, 1090, 1180, 2080, 5000, 7000, 7050, 7505, 8085, 9050, 9051, 10808, 4145,
  81, 82, 85, 888, 999, 21, 2121, 8021, 9021, 25, 465, 587, 110, 995, 143, 993, 2525, 3535, 53, 5353,
  1194, 1701, 1723, 500, 4500, 6588, 8118, 8181, 7000, 7001, 7002, 7100, 9201, 3129, 3130, 18080, 20000, 22222, 25000, 33333, 44444, 50000, 60000
];

async function seed() {
  console.log('🌱 Starting Prisma Seeding...');

  const existingEndpoints = await prisma.crawlerEndpoint.findMany({ select: { url: true } });
  const existingPorts = await prisma.openProxyPort.findMany({ select: { port: true } });

  const existingUrls = new Set(existingEndpoints.map(e => e.url));
  const existingPortNumbers = new Set(existingPorts.map(p => p.port));

  const newEndpoints = initialEndpoints.filter(url => !existingUrls.has(url)).map(url => ({
    url,
    active: true,
  }));

  if (newEndpoints.length > 0) {
    await prisma.crawlerEndpoint.createMany({ data: newEndpoints, skipDuplicates: true });
    console.log(`✅ Added ${newEndpoints.length} missing endpoints.`);
  } else {
    console.log('✅ No missing endpoints found.');
  }

  const newPorts = initialProxyPorts.filter(port => !existingPortNumbers.has(port)).map(port => ({
    port,
    protocol: 'unknown',
  }));

  if (newPorts.length > 0) {
    await prisma.openProxyPort.createMany({ data: newPorts, skipDuplicates: true });
    console.log(`✅ Added ${newPorts.length} missing proxy ports.`);
  } else {
    console.log('✅ No missing proxy ports found.');
  }

  const totalEndpoints = await prisma.crawlerEndpoint.count();
  const totalPorts = await prisma.openProxyPort.count();

  console.log(`📊 Total URLs in DB: ${totalEndpoints}`);
  console.log(`📊 Total Ports in DB: ${totalPorts}`);

  console.log('🚀 Seeding Complete!');
}

seed()
  .catch(e => {
    console.error('❌ Seeding Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
