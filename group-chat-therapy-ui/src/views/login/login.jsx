import React, {useState} from "react";
import {Link} from 'react-router-dom';

export default function Login() {
    const [count, setCount] = useState(0)

    return (
        <>
            <h1>Login page</h1>
            <Link to={"/chat"}>Click</Link>
        </>
    )
}
