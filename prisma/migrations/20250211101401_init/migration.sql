-- CreateTable
CREATE TABLE "TorExitNode" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "name" TEXT,
    "onion" TEXT,
    "port" TEXT,
    "directory" TEXT,
    "flags" TEXT,
    "uptime" TEXT,
    "version" TEXT,
    "contact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TorExitNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TorFullNode" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "name" TEXT,
    "onion" TEXT,
    "port" TEXT,
    "directory" TEXT,
    "flags" TEXT,
    "uptime" TEXT,
    "version" TEXT,
    "contact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TorFullNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapperDetection" (
    "id" SERIAL NOT NULL,
    "proxiesRange" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScrapperDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpenProxyPort" (
    "id" SERIAL NOT NULL,
    "port" INTEGER NOT NULL,
    "protocol" TEXT NOT NULL,
    "lastChecked" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpenProxyPort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlerDetection" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "port" INTEGER NOT NULL,
    "firstSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrawlerDetection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlerEndpoint" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrawlerEndpoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TorExitNode_ip_key" ON "TorExitNode"("ip");

-- CreateIndex
CREATE UNIQUE INDEX "TorFullNode_ip_key" ON "TorFullNode"("ip");

-- CreateIndex
CREATE UNIQUE INDEX "ScrapperDetection_proxiesRange_key" ON "ScrapperDetection"("proxiesRange");

-- CreateIndex
CREATE UNIQUE INDEX "OpenProxyPort_port_key" ON "OpenProxyPort"("port");

-- CreateIndex
CREATE UNIQUE INDEX "CrawlerDetection_ip_key" ON "CrawlerDetection"("ip");

-- CreateIndex
CREATE UNIQUE INDEX "CrawlerEndpoint_url_key" ON "CrawlerEndpoint"("url");
