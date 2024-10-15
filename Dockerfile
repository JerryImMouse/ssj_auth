FROM node:latest

WORKDIR /usr/src/ssj

# Copy deps to our root
COPY package.json ./

# Install deps itself
RUN npm install

# Copy the rest of the files
COPY . ./

# Create directory for database file
RUN mkdir -p assets

EXPOSE 2424

ENTRYPOINT ["node"]
CMD ["app.js"]