import express from 'express'
import { MongoClient } from 'mongodb'
import bodyParser from 'body-parser'
import podcastController from './controllers/podcastController'
import webpack from 'webpack'
import WebpackDevServer from 'webpack-dev-server'
import path from 'path'

let compiler = webpack({
  entry: [ 'babel-polyfill', path.join(__dirname, '../js/app.js')],
  module: {
    loaders: [
      {
        exclude: /node_modules/,
        loader: 'babel',
        test: /\.js$/,
      }
    ]
  },
  output: {filename: 'app.js', path: '/'}
});

const FRONT_PORT = process.env.PORT || 3000
const APP_PORT = 8080
let front = new WebpackDevServer(compiler, {
  contentBase: '/public/',
  publicPath: '/js/',
  proxy: {'/api/*': `http://localhost:${APP_PORT}`},
  stats: {colors: true},
  historyApiFallback: true
});
front.use(express.static('public'));

(async function () {
  try {
    const MONGO_URL = process.env.MONGO_URL
    let db = await MongoClient.connect(MONGO_URL)
    const app = express()

    app.set('database', db)
    app.use(bodyParser.json())
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE')
      res.header('Access-Control-Allow-Headers', 'Content-Type')
      next()
    })

    app.get('/api/all-podcasts', podcastController.handleGet)
    app.post('/api/podcast', podcastController.handlePost)
    app.get('/api/podcast/:podcastSlug', podcastController.findPodcast)

    front.listen(FRONT_PORT, () => {
      console.log(`Listening on port ${FRONT_PORT}, front`)
    })

    app.listen(APP_PORT, () => {
      console.log(`Listening on port ${APP_PORT}`)
    })

  } catch(err) {
    console.log(`an error occured: ${err}`)
  }
})()
