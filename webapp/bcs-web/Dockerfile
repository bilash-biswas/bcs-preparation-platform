FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency configs
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set env
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Expose port
EXPOSE 3000

# Run build and start at run-time to capture environment variables correctly
CMD ["sh", "-c", "npm run build && npm run start"]
