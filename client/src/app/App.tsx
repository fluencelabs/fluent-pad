import React, { useEffect, useState } from 'react';
import { connect } from 'src/fluence';
import './App.scss';

function App() {
    const [peers, setPeers] = useState<Map<string, string>>(new Map());
    const [nickName, setNickName] = useState('myNickName');

    useEffect(() => {
        const fn = async () => {
            await connect();
        };
        fn();

        return () => {};
    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <label>{nickName}</label>
                <input
                    type="text"
                    onChange={(e) => {
                        const name = e.target.value;
                        setNickName(name);
                    }}
                />
                <p>
                    <ul>
                        {Array.from(peers).map((key, value) => (
                            <li>{value}</li>
                        ))}

                        <li>Create a component</li>
                        <li>Write some code</li>
                        <li>Enjoy!</li>
                    </ul>
                </p>
            </header>
        </div>
    );
}

export default App;
