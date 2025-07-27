FROM node:latest

RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/* 

WORKDIR /app
COPY . .
RUN npm install

CMD ["npm", "run", "start:dev"]