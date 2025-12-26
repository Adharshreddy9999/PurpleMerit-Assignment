# Use official Node.js image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4000

# Start the app
CMD ["npm", "start"]
