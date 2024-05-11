import React from 'react'
import { GoAlertFill } from "react-icons/go";

const Mobile = () => {
  return (
    <div className='p-3' >
      <span className='flex items-center justify-center mb-4'>
        <span className='text-red-500'><GoAlertFill /></span>
        <span className=' font-bold text-xl mx-2 text-red-500'>Attention</span>
        <span className='text-red-500'><GoAlertFill /></span>
      </span>
      <div className=' text-center font-semibold text-base mb-2 text-slate-500'>
        This Website is Best Viewed on Desktop
      </div>
      <div className=' text-center text-sm '>
        I've designed this website for the best experience on desktop screens. I recommend switching to a desktop view for the full experience.
      </div>

    </div>
  )
}

export default Mobile