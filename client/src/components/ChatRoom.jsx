import React, { useEffect, useState } from 'react'
import { IoSendSharp } from "react-icons/io5";

const ChatRoom = ({ socket }) => {
    const [message, setMessage] = useState('')
    const [chat, setChat] = useState([])
    const [openChat, setOpenChat] = useState(false)

    useEffect(() => {
        socket.on('chat-res', (data) => {
            setChat(prevChat => [...prevChat, data])
        })
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        socket.emit('chat', message)
        setChat(prevChat => [...prevChat, { massage: message, name: 'You' }])
        setMessage('')
    }

    return (
        <div className='h-full w-full'>
            {openChat ? (
                <div className='h-full w-full bg-gray-800 rounded shadow-black shadow-md px-2'>
                    <div className='h-[10%] flex justify-center items-center mb-4'>
                        <button className='text-gray-800 w-full bg-white hover:bg-gray-950 hover:text-white focus:outline-none font-medium rounded-md text-sm py-1.5 mx-2 mb-2'
                            onClick={() => setOpenChat(false)}
                        >Close</button>
                    </div>
                    <div className='h-[78%] mb-4 overflow-auto px-2'>
                        {chat.map((data, index) => (
                            data.name === 'You' ? (
                                data.massage !== '' ? <div key={index * 99} className='mb-2 flex justify-end'>
                                    <div className='bg-gray-950 px-2 py-1.5 max-w-[60%] rounded break-words '>
                                        <div className=' text-sm font-semibold text-gray-300 pb-1'>
                                            {data.name}
                                        </div>
                                        <div className='text-sm text-white'>
                                            {data.massage}
                                        </div>
                                    </div>
                                </div> : null
                            ) : (
                                data.massage !== '' ? <div key={index * 99} className='mb-2 flex justify-start'>
                                    <div className='bg-white px-2 py-1.5 max-w-[60%] rounded break-words '>
                                        <div className=' text-sm font-semibold text-gray-800 pb-1'>
                                            {data.name}
                                        </div>
                                        <div className='text-sm text-black'>
                                            {data.massage}
                                        </div>
                                    </div>
                                </div> : null
                            )
                        ))}
                    </div>
                    <form className='flex justify-between'
                        onSubmit={handleSubmit}
                    >
                        <input type='text'
                            placeholder='Enter Message'
                            className='h-9 w-3/4 rounded bg-gray-200 border-2 ml-2 px-2 focus:outline-none'
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <button className='text-white bg-slate-600 hover:bg-gray-900 focus:outline-none font-medium rounded-md text-sm py-2 px-4 mx-2 mb-2'
                            type='submit'
                        >
                            <IoSendSharp className='w-5 h-5' />
                        </button>
                    </form>
                </ div>
            ) : (<div className='h-[10%] flex justify-end items-center'>
                <button className='text-white  bg-gray-800 hover:bg-gray-900 focus:outline-none font-medium rounded-md text-sm py-1.5 mx-2 mb-2 px-4'
                    onClick={() => setOpenChat(true)}
                >Open Chat</button>
            </div>)}
        </div>
    )
}

export default ChatRoom