# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Install latest Chromium (the browser) and necessary dependencies.
# This is the most important step.
RUN apt-get update \
    && apt-get install -y \
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libgtk-3-0 \
    libgbm-dev \
    libasound2 \
    --no-install-recommends

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy app source
COPY . .

# Tell Puppeteer to use the Chromium we just installed
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Your app binds to port 8080
EXPOSE 8080

# Define the command to run your app
CMD [ "npm", "start" ]