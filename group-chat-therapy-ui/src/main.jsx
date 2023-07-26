import React from 'react'
import ReactDOM from 'react-dom/client'
import {
    RouterProvider,
    createHashRouter,
} from 'react-router-dom';
import ChatRoom from './views/chatroom/chatroom.jsx'
import Error from './views/error/error.jsx'
import Login from './views/login/login.jsx';

const router = createHashRouter([
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
      <RouterProvider router={router}/>
  </React.StrictMode>,
)