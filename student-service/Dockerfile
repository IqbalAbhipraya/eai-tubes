# Use Node.js as base image
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port your service runs on
EXPOSE 4001

# Start the application
CMD ["node", "index.js"]