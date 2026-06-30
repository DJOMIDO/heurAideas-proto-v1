# frontend/Dockerfile

# ========== Stage 1: Build ==========
FROM node:18-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}

ENV NODE_ENV=development

COPY package*.json ./

RUN npm config set maxsockets 1 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-timeout 100000 && \
    npm install --include=dev

COPY . .

RUN chmod +x ./node_modules/.bin/* && \
    ./node_modules/.bin/tsc -b && \
    ./node_modules/.bin/vite build

# ========== Stage 2: Production (Nginx) ==========
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]