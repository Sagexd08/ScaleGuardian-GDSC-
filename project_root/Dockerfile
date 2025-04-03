# Build stage for frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .
RUN yarn build

# Production stage for frontend
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Build stage for server
FROM node:18-alpine AS server
WORKDIR /app
COPY server/package*.json ./
RUN yarn install
COPY server ./
EXPOSE 5000
CMD ["node", "src/app.js"]

# Build stage for blockchain
FROM node:18-alpine AS blockchain
WORKDIR /app
COPY blockchain/package*.json ./
RUN yarn install
COPY blockchain ./
EXPOSE 8545
CMD ["npx", "hardhat", "node"]

# Build stage for ML
FROM python:3.9-slim AS ml
WORKDIR /app
COPY ml/requirements.txt ./
RUN pip install -r requirements.txt
COPY ml ./
EXPOSE 8000
CMD ["python", "scripts/predict_gemini.py"]
