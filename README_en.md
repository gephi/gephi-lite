# Gephi Lite

Gephi Lite is a free and open-source web application to visualize and explore networks and graphs. It is a web-based, lighter version of [Gephi](https://gephi.org/). You can try it here:

**[gephi.org/gephi-lite](https://gephi.org/gephi-lite)**

It is currently under active developments, so features can evolve quite quickly. Feel free to report bugs or ask for new features in the [issues board](https://github.com/gephi/gephi-lite/issues).

You can read more about the intent of this project on the [Gephi blog](https://gephi.wordpress.com/2022/11/15/gephi-lite/).

## License

Gephi Lite source code is distributed under the [GNU General Public License v3](http://www.gnu.org/licenses/gpl.html).

## Repository structure

The codebase is organized as a [monorepo](https://en.wikipedia.org/wiki/Monorepo):

- **[packages/gephi-lite](packages/gephi-lite)** contains Gephi Lite application code
- **[packages/sdk](packages/sdk) ([`@gephi/gephi-lite-sdk` on NPM](https://www.npmjs.com/package/@gephi/gephi-lite))** contains core Gephi Lite types and utils
- **[packages/broadcast](packages/broadcast) ([`@gephi/gephi-lite-broadcast` on NPM](https://www.npmjs.com/package/@gephi/gephi-lite-sdk))** exports TypeScript helpers to control a Gephi Lite instance in another tab or frame, from other web application

## Run locally

Gephi Lite is a web application, written using [TypeScript](https://www.typescriptlang.org/) and [React](https://react.dev/). The styles are written using [SASS](https://sass-lang.com/), and are based on [Bootstrap v5](https://getbootstrap.com/).

Gephi Lite uses [sigma.js](https://www.sigmajs.org/) for graph rendering, and [graphology](https://graphology.github.io/) as the graph model as well as for graph algorithms. It is built using [Vite](https://vitejs.dev/).

To build Gephi Lite locally, you first need a recent version of [Node.js](https://nodejs.org/en) with [NPM](https://www.npmjs.com/) installed on your computer. You can then install the dependencies by running `npm install` in Gephi Lite's directory.

Now, in the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:5173/gephi-lite](http://localhost:5173/gephi-lite) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

End-to-end tests can be run with playwright.

First make sure to install browsers : `npx playwright install`

Then start the e2e tests : `npm run test:e2e`

If you have updated the project style/layout, you will have to delete the saved screenshot in /e2e/_.spec.ts-snapshots/_, and then run the e2e test to regenerate them.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your Gephi Lite is ready to be deployed!

## Docker

Docker allows building and running Gephi lite in a controlled environment without installing npm and project dependencies on your host system.

### Docker compose for development

The docker compose provided in this repository is designed for **local development** not for production.

Make sure you have a fresh version of [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/linux/) plugin. Effective July 2023 Compose is now integrated into all current Docker Desktop versions.

#### `docker compose build`

Builds or rebuilds docker image from your git checkout

#### `docker compose up`

Starts Gephi Lite with previously prebuilt image

#### `docker compose down`

Stops container and frees all the resources obtained by the container.

### Dockerfile for production

The Dockerfile provided in this repository is designed for **production**.
The application is build and then served by nginx, which its port is exposed by docker

- Build the project :

```
$> export BASE_URL="./"
$> npm run build
```

- Build the image : `docker build -f Dockerfile -t gephi-lite .`
- Create & run a container : `docker run -p 80:80 gephi-lite`

### Any custom `npm` command

Run `docker compose run --entrypoint sh gephi-lite` and you'll get into the shell where you can run all the `npm` commands from above

## Deploy the application

Deploy the static build output from `packages/gephi-lite/build`.

Build the application:

```
$> npm install
$> npm run build --workspace=@gephi/gephi-lite
```

If you serve the app with NGINX, configure SPA fallback:

```nginx
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  root /var/www/html;
  server_name _;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```
