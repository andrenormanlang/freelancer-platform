# FROM node:18-alpine AS base

# # Create app directory
# WORKDIR /app

# # Install pnpm globally
# RUN npm install -g pnpm

# # Copy package.json first
# COPY apps/api/package*.json ./apps/api/

# # Update swagger version in package.json
# RUN sed -i 's/"@nestjs\/swagger": "[^"]*"/"@nestjs\/swagger": "^11.1.0"/g' ./apps/api/package.json

# # Install dependencies
# WORKDIR /app/apps/api
# RUN npm install --legacy-peer-deps

# # Install global NestJS CLI
# RUN npm install -g @nestjs/cli@$(node -p "require('./package.json').devDependencies['@nestjs/cli'].replace('^', '')")

# # Copy source code without node_modules
# COPY apps/api/src ./src
# COPY apps/api/tsconfig*.json ./
# COPY apps/api/nest-cli.json ./

# # Build the application
# RUN npm run build

# # Production stage
# FROM node:18-alpine AS production

# WORKDIR /app/apps/api

# COPY --from=base /app/apps/api/package*.json ./
# COPY --from=base /app/apps/api/node_modules ./node_modules
# COPY --from=base /app/apps/api/dist ./dist
# RUN test -f /app/apps/api/.env && cp /app/apps/api/.env ./.env || echo "No .env file found"

# EXPOSE 3000

# CMD ["node", "dist/main.js"] 

# FOR DEPLOYMENT!!

FROM node:18-alpine AS base

# Create app directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json first
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Install global NestJS CLI
RUN npm install -g @nestjs/cli@$(node -p "require('./package.json').devDependencies['@nestjs/cli'].replace('^', '')")

# Copy source code
COPY src ./src
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]