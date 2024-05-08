const users = []

const addUser = ({ fullName, roomId, userId, host, presenter,socketId }) => { 
    const user = { fullName, roomId, userId, host, presenter,socketId }
    users.push(user)
    return users.filter(user => user.roomId === roomId)
}

const removeUser = (socketId) => { 
    const index = users.findIndex(user => user.socketId === socketId)
    if(index !== -1){
        users.splice(index, 1)[0]
    }
}

const getUser = (socketId) => { 
    return users.find(user => user.socketId === socketId)
}

module.exports = {
    addUser,
    removeUser,
    getUser
}