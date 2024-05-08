import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const JoinRoom = ({ uuid, socket }) => {
  const [roomId, setRoomId] = useState('')
  const [fullName, setFullName] = useState('')
  const navigate = useNavigate()

  const handleJoinRoom = (e) => {
    e.preventDefault()
    const roomData = {
      fullName,
      roomId,
      userId: uuid(),
      host: false,
      presenter: false
    }
    socket.emit('joinedUser', roomData)
    navigate(`/${roomId}`)
  }
  return (
    <div className='w-1/4 shadow-md py-5 px-4 rounded-md'>
      <h1 className='text-2xl font-bold text-gray-500 mb-5 pb-2 w-full border-b-2 border-gray-500'>Join Room</h1>
      <div className='w-full flex justify-center items-center'>
        <form className='w-full'>
          <div className='w-full mb-4'>
            <label htmlFor="full-name" className=" text-gray-700 font-bold ">Full Name</label>
            <input className="bg-gray-200 border-2 border-gray-200 rounded w-full py-2 px-4 mt-2 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" id="full-name" type="text" placeholder="Jane Doe"
              onChange={(e) => setFullName(e.target.value)}
              value={fullName}
            />
          </div>
          <div className='w-full mb-5'>
            <label htmlFor="full-name" className=" text-gray-700 font-bold ">Room Id</label>
            <input className="bg-gray-200 border-2 border-gray-200 rounded w-full mt-2 py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500 mr-3" id="full-name" type="text" placeholder="Room Id"
              onChange={(e) => setRoomId(e.target.value)}
              value={roomId}
            />
          </div>
          <div className='w-full'>
            <button className="shadow w-full bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
              type='submit'
              onClick={handleJoinRoom}
            >
              Join Room
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default JoinRoom