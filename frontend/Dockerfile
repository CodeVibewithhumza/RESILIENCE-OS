# Multi-stage Dockerfile for ResilienceOS Frontend (Multi-arch x86_64 & Apple Silicon ARM64)
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
# Install dependencies including optional platform-native rollup/vite binaries
RUN npm install --include=optional

COPY . .
RUN npm run build

# Production Nginx Stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
