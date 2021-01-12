import React, { useEffect, useState } from 'react';
import { connect } from 'src/fluence';
import * as calls from 'src/fluence/calls';
import { User } from 'src/fluence/calls';
import './App.scss';

export const useAsyncAction = <TData, TError>(initialData: TData, action: () => Promise<TData>) => {
    const [executing, setExecuting] = useState(false);
    const [data, setData] = useState<TData>(initialData);
    const [error, setError] = useState<TError | null>(null);

    const performAction = async () => {
        try {
            setExecuting(true);
            setError(null);
            const data = await action();
            setData(data);
        } catch (e) {
            console.log(e);
            setError(e);
        } finally {
            setExecuting(false);
        }
    };
    return [performAction, executing, data, error] as const;
};

const App = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [nickName, setNickName] = useState('myNickName');
    const [currentMsg, setCurrentMsg] = useState('Hello world!');
    const [messages, setMessages] = useState<string[]>([]);

    const [joinRoom, usersLoading, users, usersRequestError] = useAsyncAction<User[], any>([], async () => {
        const res = await calls.joinRoom(nickName);
        return res;
    });

    const leaveRoom = calls.leaveRoom;

    const clean = async () => {
        for (let u of users) {
            const res = await calls.removeUser(u.peer_id);
            console.log(res);
        }
    };

    const getHistory = async () => {
        try {
            const res = await calls.getHistory();
            if (res) {
                setMessages(res.map((x) => x.body));
            }
        } catch (e) {
            console.log('getHistory failed', e);
        }
    };

    const addMessage = async () => {
        try {
            const res = await calls.addMessage(currentMsg);
            console.log('message added', res);
        } catch (e) {
            console.log('addMessage failed', e);
        }
    };

    useEffect(() => {
        const fn = async () => {
            await connect();
            setIsConnected(true);
        };
        fn();

        return () => {};
    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <div>
                    <div>Connection status: {isConnected ? 'connected' : 'disconnected'}</div>
                    <div>
                        <label>Nickname: </label>
                        <input
                            type="text"
                            value={nickName}
                            onChange={(e) => {
                                const name = e.target.value;
                                setNickName(name);
                            }}
                        />
                    </div>
                    <div>
                        <button onClick={joinRoom}>Join Room</button>
                    </div>
                    <div>
                        <button onClick={leaveRoom}>Leave Room</button>
                    </div>
                    <div>
                        <button onClick={clean}>Clean</button>
                    </div>
                </div>
                <br />
                <div>
                    Users:
                    {usersRequestError && <div>{usersRequestError}</div>}
                    <ul>
                        {users.map((value, index) => (
                            <li key={value.peer_id}>
                                {value.name}: {value.peer_id}
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    History:
                    <div>
                        <button onClick={getHistory}>Get history</button>
                    </div>
                    <div>
                        <input
                            type="text"
                            value={currentMsg}
                            onChange={(e) => {
                                setCurrentMsg(e.target.value);
                            }}
                        />
                        <button onClick={addMessage}>Add message</button>
                    </div>
                    <ul>
                        {messages.map((value, index) => (
                            <li key={index}>{value}</li>
                        ))}
                    </ul>
                </div>
            </header>
        </div>
    );
};

export default App;
