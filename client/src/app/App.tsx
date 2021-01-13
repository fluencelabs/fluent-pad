import * as Automerge from 'automerge';
import DiffMatchPatch from 'diff-match-patch';

import React, { useEffect, useState } from 'react';
import { connect, fluenceClient } from 'src/fluence';
import * as calls from 'src/fluence/calls';
import { User } from 'src/fluence/calls';
import { fluentPadServiceId } from 'src/fluence/constants';

import './App.scss';

const dmp = new DiffMatchPatch();

const withErrorHandling = (action: Function) => {
    return () => {
        try {
            action();
        } catch (e) {
            console.log('Error occured: ', e);
        }
    };
};

const broadcastChanges = async (changes: Automerge.Change[]) => {
    const obj = {
        fluentPadChanges: changes,
    };

    const result = await calls.addMessage(JSON.stringify(obj));
    console.log(`${changes.length} changes written with result: `, result);
};

const parseState = (message: calls.Message) => {
    try {
        const obj = JSON.parse(message.body);
        if (obj.fluentPadState) {
            return Automerge.load(obj.fluentPadState);
        }
    } catch (e) {
        console.log('couldnt parse state format: ' + message.body);
        return undefined;
    }
};

const applyStates = (startingDoc, messages: calls.Message[]) => {
    let res = startingDoc;
    for (let m of messages) {
        const state = parseState(m) as any;
        if (state) {
            res = Automerge.merge(res, state);
        }
    }

    return res;
};

const App = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [isInRoom, setIsInRoom] = useState(false);
    const [nickName, setNickName] = useState('myNickName');
    const [users, setUsers] = useState<User[]>([]);

    const [editorTextDoc, setEditorTextDoc] = useState(Automerge.from({ value: new Automerge.Text() }));

    const amHistory = Automerge.getHistory(editorTextDoc).map((x) => {
        return x.snapshot.value;
    });

    const handleTextUpdate = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const prevText = editorTextDoc.value.toString();
        const newText = e.target.value;
        const diff = dmp.diff_main(prevText, newText);
        dmp.diff_cleanupSemantic(diff);
        const patches = dmp.patch_make(prevText, diff);

        const newDoc = Automerge.change(editorTextDoc, (doc) => {
            patches.forEach((patch) => {
                let idx = patch.start1;
                patch.diffs.forEach(([operation, changeText]) => {
                    switch (operation) {
                        case 1: // Insertion
                            doc.value.insertAt!(idx, ...changeText.split(''));
                            break;
                        case 0: // No Change
                            idx += changeText.length;
                            break;
                        case -1: // Deletion
                            for (let i = 0; i < changeText.length; i++) {
                                doc.value.deleteAt!(idx);
                            }
                            break;
                    }
                });
            });
        });

        setImmediate(async () => {
            const message = {
                fluentPadState: Automerge.save(editorTextDoc),
            };
            const messageStr = JSON.stringify(message);

            const result = await calls.addMessage(messageStr);
            console.log(`state written with result: `, result);
        });

        setEditorTextDoc(newDoc);
    };

    const joinRoom = withErrorHandling(async () => {
        await calls.joinRoom(nickName);
        const users = await calls.getCurrentUsers();
        setUsers(users);
        const currentUser: User = {
            peer_id: fluenceClient.selfPeerId.toB58String(),
            relay_id: fluenceClient.relayPeerID.toB58String(),
            name: nickName,
        };
        calls.notifyPeers(users, fluentPadServiceId, 'userJoined', currentUser);
        // const history = await calls.getHistory();
        // if (history) {
        //     const newDoc = applyStates(editorTextDoc, history);
        //     setEditorTextDoc(newDoc);
        // }
        setIsInRoom(true);
    });

    const leaveRoom = async () => {
        await calls.leaveRoom;
        calls.notifyPeers(users, fluentPadServiceId, 'userLeft', currentUser);
        setIsInRoom(false);
    };

    const clean = async () => {
        for (let u of users) {
            const res = await calls.removeUser(u.peer_id);
            console.log(res);
        }
        setIsInRoom(false);
    };

    useEffect(() => {
        const fn = async () => {
            await connect();
            setIsConnected(true);

            fluenceClient.registerEvent(fluentPadServiceId, 'userJoined');
            fluenceClient.registerEvent(fluentPadServiceId, 'userLeft');
            fluenceClient.registerEvent(fluentPadServiceId, 'textUpdated');

            fluenceClient.subscribe(fluentPadServiceId, (evt) => {
                console.log('got notification: ', evt);
                switch (evt.type) {
                    case 'userJoined':
                        break;
                    case 'userLeft':
                        break;
                    case 'textUpdated':
                        break;
                }
            });
        };
        fn();

        return () => {
            fluenceClient.unregisterEvent(fluentPadServiceId, 'userJoined');
            fluenceClient.unregisterEvent(fluentPadServiceId, 'userLeft');
            fluenceClient.unregisterEvent(fluentPadServiceId, 'textUpdated');
        };
    }, []);

    return (
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
                <div>
                    <button onClick={clean}>Clean</button>
                </div>
            </div>
            <br />
            {isInRoom && (
                <>
                    <div>
                        Users:
                        <ul>
                            {users.map((value, index) => (
                                <li key={value.peer_id}>
                                    {value.name}: {value.peer_id}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        Editor
                        <br />
                        <textarea
                            disabled={!isInRoom}
                            onChange={handleTextUpdate}
                            value={editorTextDoc.value.toString()}
                        />
                    </div>
                    <div>
                        History:
                        <ul>
                            {amHistory.map((value, index) => (
                                <li key={index}>{value}</li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
};

export default App;
