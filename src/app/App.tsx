import React, { useEffect, useState } from 'react';
import { connect, fluenceClient } from 'src/fluence';
import { FluentPadClientPeer, FluentPadService } from 'src/fluence/FluentPadClient';
import './App.scss';

function App() {
    const [service, setService] = useState<FluentPadService>();
    const [peers, setPeers] = useState<Map<string, string>>(new Map());
    const [nickName, setNickName] = useState('myNickName');

    useEffect(() => {
        const fn = async () => {
            await connect();
            const service = new FluentPadService(fluenceClient, nickName);
            service.on('disconnected', (peer: FluentPadClientPeer) => {
                setPeers((prev) => {
                    prev.delete(peer.peerId);
                    return prev;
                });
            });
            service.on('newConnected', (peer: FluentPadClientPeer) => {
                setPeers((prev) => {
                    prev.set(peer.peerId, peer.nickname);
                    return prev;
                });
            });
            service.on('nameChanged', (peerId: string, newName: string) => {
                setPeers((prev) => {
                    prev.set(peerId, newName);
                    return prev;
                });
            });
            setService(service);
            await service.connect();
        };
        fn();

        return () => {
            service?.disconnect();
        };
    }, []);

    return (
        <div className="App">
            <header className="App-header">
                <label>nickName</label>
                <input
                    type="text"
                    onChange={(e) => {
                        const name = e.target.value;
                        setNickName(name);
                        service?.changeNickname(name);
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
