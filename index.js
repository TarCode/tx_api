import express from 'express'
import http from 'http'

import socketio from 'socket.io'

import routes from './routes'
import headers from './middleware/headers'

const app = express()

const server = http.createServer(app)
const io = socketio(server)

console.log("Express server running");

const PORT = 3000

app.get('/', (req, res) => {
  return res.send('Hello World!')
})

app.use(headers)

app.use('/api', routes)

// Websocket logic for live data
io.on("connection", function(socket) {

});

server.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));
