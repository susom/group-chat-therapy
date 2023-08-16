import React from 'react'
import ReactDOM from 'react-dom/client'
import {
    RouterProvider,
    createHashRouter,
} from 'react-router-dom';

import { SessionContextProvider } from './contexts/Session.jsx';

import ChatRoom from './views/chatroom/chatroom.jsx'
import Landing from './views/landing/landing.jsx'
import Error from './views/error/error.jsx'
import Login from './views/login/login.jsx'
import Select from './views/select/select.jsx'

const router = createHashRouter([
    {
        path: "/landing",
        element: <Landing />,
        errorElement: <Error/>
    },
    {
        path: "/select",
        element: <Select/>,
        errorElement: <Error/>
    },
    {
        path: "/chat",
        element: <ChatRoom />,
        errorElement: <Error/>
    },
    {
        path: "/",
        element: <Login />,
        errorElement: <Error/>

    }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
      <SessionContextProvider>
        <RouterProvider router={router}/>
      </SessionContextProvider>
  </React.StrictMode>,
)
