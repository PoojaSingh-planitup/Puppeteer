FROM node:20-slim

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    wget \
    ca-certificates \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy and install dependencies, including Chromium via Puppeteer
COPY package.json ./
RUN npm install

COPY src ./src

# Let Puppeteer use the bundled Chromium
CMD ["node", "src/main.js"]
