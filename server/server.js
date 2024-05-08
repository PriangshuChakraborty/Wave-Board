const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const { addUser, getUser, removeUser } = require('./utils/allUser');


const io = new Server(server)

app.get('/', (req, res) => { 
    res.send('Server is running')
})

let roomIdGlobal , imgDataGlobal

io.on('connection', (socket) => {
    socket.on('joinedUser', (data) => {

        const { fullName, roomId, userId, host, presenter } = data
        roomIdGlobal = roomId
        socket.join(roomId)
        const users = addUser({ fullName, roomId, userId, host, presenter ,socketId: socket.id })
        socket.emit('userIsJoined', { ...data, success: true, users })
        socket.broadcast.to(roomId).emit('UserJoinedMsg', fullName)
        socket.broadcast.to(roomId).emit('allUsers', users)
        socket.broadcast.to(roomId).emit('canvas-data-res', { 
            imgUrl: imgDataGlobal
         })
    })

    socket.on('canvasData', (data) => {
        imgDataGlobal = data
        socket.broadcast.to(roomIdGlobal).emit('canvas-data-res', {
            imgUrl: data
        })
        
    })

    socket.on('chat', (data) => {
        const user = getUser(socket.id)
        if(user) {
            socket.broadcast.to(roomIdGlobal).emit('chat-res', { massage : data , name: user.fullName})
        }
    })

    socket.on('raiseHand', () => { 
        const user = getUser(socket.id)
        if(user) {
            socket.broadcast.to(roomIdGlobal).emit('raiseHand-res', { name: user.fullName })
        }
    })

    socket.on('reaction', (data) => { 
        const user = getUser(socket.id)
        if(user) {
            socket.broadcast.to(roomIdGlobal).emit('reaction-res', { name: user.fullName, reaction: data })
        }
    })

    socket.on('disconnect', () => {
        const user = getUser(socket.id)
        if(user){
            removeUser(socket.id)
            socket.broadcast.to(roomIdGlobal).emit('UserLeftMsg', user)
        }
    })
});

const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})