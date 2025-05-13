# Use official Microsoft Playwright image
FROM mcr.microsoft.com/playwright:v1.43.1-jammy

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY src ./src

# Define entry point
CMD ["node", "src/main.js"]
