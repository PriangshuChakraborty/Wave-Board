import React from 'react'
import WhiteBoard from '../components/WhiteBoard'
import ShowedUser from '../components/ShowedUser'
import ChatRoom from '../components/ChatRoom'
import logo from '../assets/logo.png'

const Home = ({ user, socket, users }) => {
  return (
    <div className=' w-screen h-screen flex justify-center items-center'>
      <div className='flex justify-start h-full w-[15%] py-3' >
        <ShowedUser users={users} user={user} />
      </div>

      <div className='flex-col justify-center items-center'>
        <div className='flex flex-col justify-center items-center'>
          <img src={logo} alt="logo" className='w-[350px] mb-2' />
          <div className='flex justify-center items-center mb-3'>
            <div className='text-2xl font-serif text-slate-700'>
              User Online : {users.length}
            </div>
          </div>
        </div>
        <div className='flex justify-center items-center mx-9'>
          <WhiteBoard user={user} socket={socket} />
        </div>
      </div>
      <div className='flex justify-start h-full w-[20%] py-3' >
        <div className='h-full w-full'>
          <ChatRoom socket={socket} />
        </div>
      </div>
    </div>
  )
}

export default Home