# frontend/Dockerfile

# ========== Stage 1: Build ==========
FROM node:18-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./

RUN npm config set fetch-retries 5 && \
    npm config set fetch-timeout 100000 && \
    npm config set maxsockets 3 && \
    npm install

COPY . .

RUN npx vite build

# ========== Stage 2: Production (Nginx) ==========
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]