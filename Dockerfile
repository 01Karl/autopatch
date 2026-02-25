FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*

COPY requirements-python.txt ./
RUN pip3 install --break-system-packages --no-cache-dir -r requirements-python.txt

COPY dashboard/package.json ./dashboard/
WORKDIR /app/dashboard
RUN npm install

WORKDIR /app
COPY . .

RUN cd dashboard && npm run build

EXPOSE 3000
CMD ["npm", "--prefix", "dashboard", "run", "start"]
