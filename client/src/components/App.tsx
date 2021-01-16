import { createClient, FluenceClient } from '@fluencelabs/fluence';
import React, { useEffect, useState } from 'react';

import './App.scss';
import { FluenceClientContext } from '../app/FluenceClientContext';
import { UserList } from './UserList';
import * as api from 'src/app/api';
import { CollaborativeEditor } from './CollaborativeEditor';
import { relayNode } from 'src/app/constants';

const App = () => {
    const [client, setClient] = useState<FluenceClient | null>(null);
    const [isInRoom, setIsInRoom] = useState<boolean>(false);
    const [nickName, setNickName] = useState('');

    useEffect(() => {
        const fn = async () => {
            const c = await createClient(relayNode);

            setClient(c);
        };
        fn();
    }, []);

    const joinRoom = async () => {
        if (!client) {
            return;
        }

        await api.join(client, nickName);
        setIsInRoom(true);
    };

    const leaveRoom = async () => {
        if (!client) {
            return;
        }

        await api.leave(client);
        setIsInRoom(false);
    };

    return (
        <FluenceClientContext.Provider value={client}>
            <div className="header-wrapper">
                <div className="header">
                    <div className="header-item">
                        {isInRoom && (
                            <button className="button" disabled={!isInRoom} onClick={leaveRoom}>
                                Leave
                            </button>
                        )}
                    </div>

                    <div className="header-item">
                        Connection status: {client ? <span className="accent">connected</span> : 'disconnected'}
                    </div>
                </div>
            </div>
            <div>
                <div className="content">
                    {!isInRoom && (
                        <div className="welcome-form">
                            <h1 className="form-caption">Welcome to FluentPad</h1>
                            <input
                                className="text-input"
                                placeholder="Your name"
                                type="text"
                                value={nickName}
                                disabled={isInRoom}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    setNickName(name);
                                }}
                            />

                            <button
                                className="join-button"
                                disabled={isInRoom || !client || !nickName}
                                onClick={joinRoom}
                            >
                                Join
                            </button>
                        </div>
                    )}

                    {isInRoom && (
                        <div className="room-wrapper">
                            <h1 className="fluent-pad">FluentPad</h1>
                            <UserList selfName={nickName} />
                            <CollaborativeEditor />
                        </div>
                    )}
                </div>
            </div>
        </FluenceClientContext.Provider>
    );
};

export default App;
