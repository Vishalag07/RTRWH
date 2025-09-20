FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Build the app with environment variables
ARG VITE_API_BASE
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

EXPOSE 3000
# Use development mode for better error messages
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]


