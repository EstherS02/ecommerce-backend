# Use official Node.js image
FROM node:22-alpine

# Create working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of the project
COPY . .

# Tell Docker the app listens on port 5000
EXPOSE 5000

# Start the application
CMD ["npm", "start"]