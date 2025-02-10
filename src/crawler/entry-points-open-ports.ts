import * as fs from 'fs';

function shuffleArray<T>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}

export const entryPoints: string[] = shuffleArray([
  "https://www.ipdeny.com/ipblocks/",
  "https://www.free-proxy-list.net/",
  "https://www.proxynova.com/proxy-server-list/",
  "https://www.sslproxies.org/",
  "https://www.us-proxy.org/",
  "https://www.socks-proxy.net/",
  "https://spys.one/en/free-proxy-list/",
  "https://hidemy.name/en/proxy-list/",
  "https://www.xroxy.com/proxylist.htm",
  "https://www.nirsoft.net/countryip/",
  "https://www.my-proxy.com/free-proxy-list.html",
  "https://www.cool-proxy.net/",
  "https://proxydb.net/",
  "https://www.proxylists.net/",
  "https://openproxy.space/list",
  // Added famous URLs
  "https://www.wikipedia.org/", // Wikipedia
  "https://www.torproject.org/", // Tor Project
  "https://www.zeit.de/", // Die Zeit (German news)
  "https://www.bbc.com/", // BBC News
  "https://www.reddit.com/", // Reddit
  "https://www.vonage.com/", // Vonage (VoIP services)
  "https://www.wired.com/", // Wired (technology news)
  "https://www.nytimes.com/", // New York Times
  "https://www.cnn.com/", // CNN
  "https://www.theguardian.com/", // The Guardian
  "https://www.wikileaks.org/" // WikiLeaks
]);


export async function loadProxyPorts(): Promise<number[]> {
  try {
    const data = fs.readFileSync('proxy_ports.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [
      // HTTP & HTTPS Proxy Ports
      80, 443, 8000, 8080, 8081, 8088, 8090, 8888, 8443, 3128, 9999, 3838, 9080, 8118, 8181, 8899, 9000, 9443,

      // SOCKS Proxy Ports
      1080, 1081, 1082, 1083, 1084, 1085, 1086, 1090, 1180, 2080, 5000, 7000, 7050, 7505, 8085, 9050, 9051, 10808, 4145,

      // Transparent & Reverse Proxy Ports
      3128, 8080, 80, 443, 8443, 81, 82, 85, 888, 999,

      // FTP Proxy Ports
      21, 2121, 8021, 9021,

      // Email Proxy Ports (SMTP, POP3, IMAP)
      25, 465, 587, 110, 995, 143, 993, 2525, 3535,

      // DNS Proxy Ports
      53, 5353,

      // VPN & Security Proxy Ports
      1194, 1701, 1723, 500, 4500,

      // Less Common Proxy Ports
      6588, 8118, 8181, 7000, 7001, 7002, 7100, 9201, 4145, 9050, 9051,
      3129, 3130, 9443, 18080, 20000, 22222, 25000, 33333, 44444, 50000, 60000
    ];
  }
}

export const scrapperRequired: string[] = [
  "https://proxylist.geonode.com/api/proxy-list",
  "https://www.proxyscrape.com/free-proxy-list",
  "https://www.proxy-list.download/api/v1/get?type=http",
  "https://www.proxy-list.download/api/v1/get?type=https",
  "https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all",
  "https://api.openproxylist.xyz/http.txt",
  "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt",
  "https://raw.githubusercontent.com/proxy4parsing/proxy-list/main/http.txt",
  "https://raw.githubusercontent.com/mmpx12/proxy-list/master/https.txt",
  "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt",
  "https://raw.githubusercontent.com/roosterkid/openproxylist/main/HTTPS_RAW.txt",
  "https://openproxy.space/list/http",
  "http://pubproxy.com/api/proxy",
  "https://www.proxy-list.download/api/v1/get?type=socks4",
  "https://api.proxyscrape.com/v2/?request=getproxies&protocol=socks4&timeout=10000&country=all",
  "https://api.openproxylist.xyz/socks4.txt",
  "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks4.txt",
  "https://raw.githubusercontent.com/mmpx12/proxy-list/master/socks4.txt",
  "https://raw.githubusercontent.com/roosterkid/openproxylist/main/SOCKS4_RAW.txt",
  "https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks4.txt",
  "https://openproxy.space/list/socks4",
  "https://www.proxy-list.download/api/v1/get?type=socks5",
  "https://api.proxyscrape.com/v2/?request=getproxies&protocol=socks5&timeout=10000&country=all",
  "https://api.openproxylist.xyz/socks5.txt",
  "https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks5.txt",
  "https://raw.githubusercontent.com/mmpx12/proxy-list/master/socks5.txt",
  "https://raw.githubusercontent.com/thespeedx/proxy-list/master/socks5.txt",
  "https://raw.githubusercontent.com/roosterkid/openproxylist/main/SOCKS5_RAW.txt",
  "https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt",
  "https://openproxy.space/list/socks5"
];
