import React, { useState } from 'react'


const ShowedUser = ({ users, user }) => {
    const [openUserTab, setOpenUserTab] = useState(false)

    return (
        <div className='h-full w-full'>
            {openUserTab ? (
                <div className='h-full w-full bg-gray-800 rounded shadow-black shadow-md px-2' >
                    <div className='h-[10%] flex justify-center items-center mb-10'>
                        <button className='text-gray-800 w-full bg-white hover:bg-gray-950 hover:text-white focus:outline-none font-medium rounded-md text-sm py-1.5 mx-2 mb-2'
                        onClick={() => setOpenUserTab(false)}
                        >Close</button>
                    </div>
                    <div className='h-[5%] flex justify-center items-center mb-3 border-b-2 border-white pb-2'>
                        <h1 className='text-lg font-serif font-semibold text-white '>All Users <span className=' font-thin'>:</span><span className='font-sans'> {users.length} </span></h1>
                    </div>
                    <div className='text-start overflow-auto'>
                        {users.map((usr, index) => (
                            <p key={index * 99} className='mb-1.5 text-gray-400 pl-1' >
                               {index+1}. {usr.fullName} <span className='text-green-400'>{usr.host && '[Host]'} </span> <span className='text-gray-200'>{user && usr.userId === user.userId && '(You)'}</span>
                            </p>
                        ))}
                    </div>
                </div>
            ) : (
                    <div className='h-[10%] flex justify-start items-center'>
                        <button className='text-white  bg-gray-800 hover:bg-gray-900 focus:outline-none font-medium rounded-md text-sm py-1.5 mx-2 mb-2 px-4'
                        onClick={() => setOpenUserTab(true)}
                        >Show Users</button>
                    </div>
            )}
        </div>
    )
}

export default ShowedUser