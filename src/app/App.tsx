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
                    const res = new Map(prev.entries());
                    res.delete(peer.peerId);
                    return res;
                });
            });
            service.on('newConnected', (peer: FluentPadClientPeer) => {
                setPeers((prev) => {
                    const res = new Map(prev.entries());
                    res.set(peer.peerId, peer.nickname);
                    return res;
                });
            });
            service.on('nameChanged', (peerId: string, newName: string) => {
                setPeers((prev) => {
                    const res = new Map(prev.entries());
                    res.set(peerId, newName);
                    return res;
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
                <label>Nick name</label>
                <input
                    type="text"
                    onChange={(e) => {
                        const name = e.target.value;
                        setNickName(name);
                        service?.changeNickname(name);
                    }}
                    value={nickName}
                />
                <div>
                    <ul>
                        <>
                            {Array.from(peers).map((key, value) => (
                                <li key={value}>{value}</li>
                            ))}
                        </>
                    </ul>
                </div>
            </header>
        </div>
    );
}

export default App;
