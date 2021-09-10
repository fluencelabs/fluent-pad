import { Fluence } from '@fluencelabs/fluence';
import React, { useEffect, useState } from 'react';

import './App.scss';

import { UserList } from './UserList';
import { CollaborativeEditor } from './CollaborativeEditor';
import { fluentPadApp, relayNode } from 'src/app/constants';
import { CheckResponse, withErrorHandlingAsync } from './util';
import { join, leave, registerAppConfig } from 'src/_aqua/app';


const App = () => {
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isInRoom, setIsInRoom] = useState<boolean>(false);
    const [nickName, setNickName] = useState('');

    const connect = async () => {
        try {
            await Fluence.start({ connectTo: relayNode });

            setIsConnected(true);

            registerAppConfig({
                getApp: () => {
                    return fluentPadApp
                },
            })
        }
        catch (err) {
            console.log('Peer initialization failed', err)
        }
    }

    useEffect(() => {
        connect()
    }, []);

    const joinRoom = async () => {
        if (!isConnected) {
            return;
        }

        await withErrorHandlingAsync(async () => {
            const res = await join( {
                peer_id: Fluence.getStatus().peerId!,
                relay_id: Fluence.getStatus().relayPeerId!,
                name: nickName,
            });
            if (CheckResponse(res)) {
                setIsInRoom(true);
            }
        });
    };

    const leaveRoom = async () => {
        if (!isConnected) {
            return;
        }

        await withErrorHandlingAsync(async () => {
            await leave();
            setIsInRoom(false);
        });
    };

    return (
        <>
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
                        Connection status: {isConnected ? <span className="accent">connected</span> : 'disconnected'}
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
                                disabled={isInRoom || !isConnected || !nickName}
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
        </>
    );
};

export default App;
