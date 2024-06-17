FROM node:20
ARG BASE_URL="/"

RUN apt-get -qq update && apt-get -qqy install nginx && apt-get clean

COPY . /opt/code
WORKDIR /opt/code
RUN npm install && npm cache clean --force
RUN npm run build
RUN rm  /var/www/html/*
RUN cp -f nginx.conf /etc/nginx/sites-available/default
RUN cp -R build/* /var/www/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
