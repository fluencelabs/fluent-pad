import * as Automerge from 'automerge';
import DiffMatchPatch from 'diff-match-patch';

import React, { useEffect, useState } from 'react';
import { connect } from 'src/fluence';
import * as calls from 'src/fluence/calls';
import { User } from 'src/fluence/calls';
import { parse } from 'url';

import './App.scss';

const dmp = new DiffMatchPatch();

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

const broadcastChanges = async (changes: Automerge.Change[]) => {
    const obj = {
        fluentPadChanges: changes,
    };

    const result = await calls.addMessage(JSON.stringify(obj));
    console.log(`${changes.length} changes written with result: `, result);
};

const broadcastState = async (state: string) => {
    const obj = {
        fluentPadState: state,
    };

    const result = await calls.addMessage(JSON.stringify(obj));
    console.log(`state written with result: `, result);
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

const parseChanges = (rawMessages: calls.Message[]): Automerge.Change[] => {
    return rawMessages
        .map((x) => x.body)
        .map((x) => {
            try {
                const obj = JSON.parse(x);
                if (obj.fluentPadChanges) {
                    return obj.fluentPadChanges as Automerge.Change[];
                }
            } catch (e) {
                console.log('couldnt parse change format: ' + x);
                return undefined;
            }
        })
        .filter((x) => x !== undefined)
        .flatMap((x) => x as Automerge.Change[]);
};

const App = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [nickName, setNickName] = useState('myNickName');
    const [currentMsg, setCurrentMsg] = useState('Hello world!');

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

        // let changes = Automerge.getChanges(editorTextDoc, newDoc);
        // broadcastChanges(changes);
        const state = Automerge.save(editorTextDoc);
        broadcastState(state);

        setEditorTextDoc(newDoc);
    };

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

    const mergeExternalChanges = (changes: Automerge.Change[]) => {
        const newDoc = Automerge.applyChanges(editorTextDoc, changes);
        console.log(Automerge.getAllChanges(newDoc));
        setEditorTextDoc(newDoc);
    };

    // const getHistory = async () => {
    //     try {
    //         const res = await calls.getHistory();
    //         if (res) {
    //             console.log(res);
    //             const changes = parseChanges(res);
    //             console.log(changes);
    //             mergeExternalChanges(changes);
    //         }
    //     } catch (e) {
    //         console.log('getHistory failed', e);
    //     }
    // };

    const getHistory = async () => {
        try {
            const res = await calls.getHistory();
            if (res) {
                const newDoc = applyStates(editorTextDoc, res);
                setEditorTextDoc(newDoc);
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
                    Editor
                    <br />
                    <textarea onChange={handleTextUpdate} value={editorTextDoc.value.toString()} />
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
                        {amHistory.map((value, index) => (
                            <li key={index}>{value}</li>
                        ))}
                    </ul>
                </div>
            </header>
        </div>
    );
};

export default App;
