# Gephi Lite

Gephi Lite is a web-based, lighter version of Gephi. It uses [sigma.js](https://www.sigmajs.org/) for graph rendering, and [graphology](graphology.github.io/) as the graph model as well as for graph algorithms. It is bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

You can read more about the intent of this project on [Gephi blog](https://gephi.wordpress.com/2022/11/15/gephi-lite/).

## License

Gephi Lite source code is distributed under the [GNU General Public License v3](http://www.gnu.org/licenses/gpl.html).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000/gephi-lite](http://localhost:3000/gephi-lite) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

## Deploy the application

To deploy the application, you need to build it, by following those steps :

```
$> REACT_APP_GITHUB_PROXY=mydomain.for.github.auth.proxy.com
$> npm install
$> npm run build
```

For the github auth to work, you need to have a reverse proxy somewhere (for CORS reason). That's why you need to define the env variable `REACT_APP_GITHUB_PROXY` before to build the application.

On https://gephi.org/gephi-lite we use this settings : `REACT_APP_GITHUB_PROXY: "https://gephi-lite.ouestware.com"`

Then on our server we configured nginx with this following settings :

```
server {
    listen       443 ssl;
    server_name  https://gephi-lite.ouestware.com;

    ssl_certificate /etc/letsencrypt/live/XXXXX/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/XXXXX/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

   location /login {
     add_header Access-Control-Allow-Origin "https://gephi.org";
     add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
     add_header Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, user-agent";
     if ($request_method = OPTIONS) {
        return 204;
     }
     proxy_pass https://github.com/login;
   }

   location / {
     return 404;
   }
}
```
