import express from 'express'
import http from 'http'
import bodyParser from 'body-parser'
import socketio from 'socket.io'

import routes from './routes'

const app = express()

const server = http.createServer(app)
const io = socketio(server)

console.log("Express server running");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = 3000

app.get('/', (req, res) => {
  return res.send('Hello World!')
})

app.use('/api', routes)

// const start = async () => {
//     // Insert accounts and transfer some money
//     const account = await Account.create([{ name: 'A', balance: 5 }, { name: 'B', balance: 10 }]);

//     await transfer('A', 'B', 4); // Success
//     try {
//     // Fails because then A would have a negative balance
//     await transfer('A', 'B', 2);
//     } catch (error) {
//     error.message; // "Insufficient funds: 1"
//     }
// }

// Websocket logic for live data
io.on("connection", function(socket) {

});

server.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));
