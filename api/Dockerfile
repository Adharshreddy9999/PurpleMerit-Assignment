# Use official Node.js image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies


COPY package*.json ./
RUN npm install

# Copy prisma schema before generating client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the app
COPY . .

# Expose port
EXPOSE 4000

# Start the app in development mode with ts-node for Swagger JSDoc support
CMD ["npx", "ts-node", "src/index.ts"]
