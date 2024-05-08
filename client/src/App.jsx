import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import io from 'socket.io-client'
import Dashboard from './pages/Dashboard'
import Home from './pages/Home'
import uuidGen from './utils/UuidGen'
import { ToastContainer, toast } from 'react-toastify'

const server = "http://localhost:5000";

const connectionOptions = {
  "force new connection": true,
  reconnectionAttempts: "Infinity",
  timeout: 10000,
  transports: ["websocket"],
};

const socket = io(server, connectionOptions);



const App = () => {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])

  useEffect(() => {
    socket.on('userIsJoined', (data) => {
      if(data.success){
        console.log('User is joined')
        setUser(data)
        setUsers(data.users)
      } else {
        console.log('User is not joined')
      }
    })

    socket.on('allUsers', (data) => {
      setUsers(data)
    })

    socket.on('UserJoinedMsg', (data) => {
      toast.success(`${data} joined the room`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    })

    socket.on('UserLeftMsg', (data) => {
      toast.error(`${data.fullName} left the room`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      setUsers(users => users.filter(usr => usr.userId !== data.userId))
    })

    socket.on('raiseHand-res', (data) => { 
      toast.info(`${data.name} raised hand`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    })

    socket.on('reaction-res', (data) => { 
      toast.info(`${data.name} reacted with ${data.reaction}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    })

  }, [])

  
  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Dashboard uuid={uuidGen} socket={socket} />} />
        <Route path="/:roomId" element={<Home user={user} socket={socket} users={users} />} />
      </Routes>
    </div>
  )
}

export default App
