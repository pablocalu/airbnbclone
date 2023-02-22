import React from 'react'
import { useState } from 'react'
import axios from 'axios'


export default function PhotosUploader2({addedPhotos2, onChange}) {

    const uploadPhoto = (e) => {
        const files = e.target.files
        const data = new FormData()
        for (let i = 0; i < files.length; i++) {
          data.append('photos', files[i]);
        }
        axios.post('/upload', data, {
          headers: {'Content-type': 'multipart/form-data'}
        }).then( response => {
          const { data:filenames } = response;
          console.log(filenames)
          onChange(prev => {
            return [...prev, ...filenames]
          })
        })
      }
  return (
    <div className='flex gap-2'>
            <div className="gap-2 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {addedPhotos2.length > 0 && addedPhotos2.map(link => (
                <div className='h-32 flex relative' key={link}>
                  <img className='rounded-2xl w-full object-cover' src={`http://localhost:4000/${link}`} />
                </div>
              ))}
              <label className="h-32 cursor-pointer flex items-center gap-1 justify-center border bg-transparent rounded-2xl p-2 text-2xl text-gray-600">
              <input type={'file'} multiple className='hidden' onChange={uploadPhoto}/>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                  />
                </svg>
                Upload
              </label>
              </div>
    </div>
  )
}
