import { FluenceClient } from '@fluencelabs/fluence';
import React, { useEffect, useState } from 'react';
import { connect } from 'src/fluence';

import './App.scss';
import { FluenceClientContext } from './FluenceClientContext';
import { UserList } from './UserList';
import * as calls from 'src/fluence/calls';

const App = () => {
    const [client, setClient] = useState<FluenceClient | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isInRoom, setIsInRoom] = useState(false);
    const [nickName, setNickName] = useState('myNickName');

    useEffect(() => {
        const fn = async () => {
            const c = await connect();
            setIsConnected(true);
            setClient(c);
        };
        // fn();
    }, []);

    const joinRoom = async () => {
        const c = await connect();
        setIsConnected(true);
        setClient(c);
        await calls.joinRoom(nickName);
        setIsInRoom(true);
    };

    const leaveRoom = async () => {
        await calls.leaveRoom();
        setIsInRoom(false);
    };

    return (
        <FluenceClientContext.Provider value={client}>
            <div className="App">
                <div>
                    <div>Connection status: {isConnected ? 'connected' : 'disconnected'}</div>
                    <div>
                        <label>Nickname: </label>
                        <input
                            type="text"
                            value={nickName}
                            disabled={isInRoom}
                            onChange={(e) => {
                                const name = e.target.value;
                                setNickName(name);
                            }}
                        />
                    </div>
                    <div>
                        <button disabled={isInRoom} onClick={joinRoom}>
                            Join Room
                        </button>
                    </div>
                    <div>
                        <button disabled={!isInRoom} onClick={leaveRoom}>
                            Leave Room
                        </button>
                    </div>
                </div>

                <div>{isConnected && client && isInRoom && <UserList />}</div>
            </div>
        </FluenceClientContext.Provider>
    );
};

export default App;
