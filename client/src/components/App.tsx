import { createClient, FluenceClient } from '@fluencelabs/fluence';
import React, { useEffect, useState } from 'react';

import './App.scss';

import { FluenceClientContext } from '../app/FluenceClientContext';
import { UserList } from './UserList';
import { CollaborativeEditor } from './CollaborativeEditor';
import { fluentPadApp, relayNode } from 'src/app/constants';
import { CheckResponse, withErrorHandlingAsync } from './util';
import { join, leave } from 'src/aqua/app';

const createClientEx = async (relay) => {
    const client = await createClient(relay);
    client.aquaCallHandler.on('fluence/get-config', 'getApp', () => {
        return fluentPadApp;
    });
    client.aquaCallHandler.on('fluence/get-config', 'get_init_peer_id', () => {
        return client.selfPeerId;
    });
    client.aquaCallHandler.on('fluence/get-config', 'get_init_relay', () => {
        return client.relayPeerId!;
    });
    return client;
};

const App = () => {
    const [client, setClient] = useState<FluenceClient | null>(null);
    const [isInRoom, setIsInRoom] = useState<boolean>(false);
    const [nickName, setNickName] = useState('');

    useEffect(() => {
        createClientEx(relayNode)
            .then((client) => setClient(client))
            .catch((err) => console.log('Client initialization failed', err));
    }, []);

    const joinRoom = async () => {
        if (!client) {
            return;
        }

        await withErrorHandlingAsync(async () => {
            const res = await join(client, {
                peer_id: client.selfPeerId,
                relay_id: client.relayPeerId!,
                name: nickName,
            });
            if (CheckResponse(res)) {
                setIsInRoom(true);
            }
        });
    };

    const leaveRoom = async () => {
        if (!client) {
            return;
        }

        await withErrorHandlingAsync(async () => {
            await leave(client);
            setIsInRoom(false);
        });
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
                        <form
                            className="welcome-form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                joinRoom();
                            }}
                        >
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

                            <input
                                type="submit"
                                className="join-button"
                                disabled={isInRoom || !client || !nickName}
                                value="Join"
                            />
                        </form>
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
