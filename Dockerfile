FROM nginx:latest

COPY ./packages/gephi-lite/build/ /var/www/html/
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80