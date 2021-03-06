express = require 'express'
app = express()
ws = require 'websocket.io'
uuid = require 'node-uuid'

app.use express.static './src'

console.log("running on port 3002")
server = app.listen 3002

io = ws.attach server

io.clientsById ||= {}
io.clientsByRoom ||= {}

io.on 'connection', (socket) ->
  room = "default"
  socket.id = uuid.v1()
  socket.room = room

  if !room
    socket.close()
    return

  io.clientsByRoom[room] ||= []
  io.clientsByRoom[room].push socket
  io.clientsById[socket.id] = socket
  
  socket.send JSON.stringify
    type: 'assigned_id'
    id: socket.id

  socket.on 'message', (data) ->
    msg = JSON.parse(data)

    switch msg.type
      when 'received_offer', 'received_candidate', 'received_answer'
        # broadcast to all connected clients in the room
        # except for the socket that initiated this message
        for sock in io.clientsByRoom[socket.room]
          if sock.id != socket.id
            sock.send(JSON.stringify msg)

      when 'close'
        socket.close()
