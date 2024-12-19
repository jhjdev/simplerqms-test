FROM node:22-alpine AS build

# Set the workdir
WORKDIR /app

# Copy over the package.json
COPY package.json package-lock.json ./

# Install the modules
RUN npm ci

# Copy the files over
COPY . .

# Expose the port
EXPOSE 5173

# Start vite
CMD ["npm", "run", "dev"]