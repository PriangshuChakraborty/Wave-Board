import React from 'react'
import CreateRoom from '../components/CreateRoom'
import JoinRoom from '../components/JoinRoom'

const Dashboard = ({uuid,user,socket }) => {
  return (
    <div className='w-full h-screen flex justify-evenly items-center'>
      <CreateRoom uuid={uuid} socket={socket} />
      <JoinRoom uuid={uuid} socket={socket}  />
    </div>
  )
}

export default Dashboard