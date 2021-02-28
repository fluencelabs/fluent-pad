import _, { update } from 'lodash';
import React, { useEffect, useState } from 'react';
import { PeerIdB58, subscribeToEvent } from '@fluencelabs/fluence';

import { addStyles, EditableMathField } from 'react-mathquill';

import { fluentPadServiceId, notifyTextUpdateFnName } from 'src/app/constants';
import { useFluenceClient } from '../app/FluenceClientContext';
import { getUpdatedDocFromText, initDoc, SyncClient } from '../app/sync';
import * as api from 'src/app/api';
import { DrawingBoard } from './DrawingBoard';
import { useRealtimeDrawer, useRealtimeViewer } from 'react-realtime-drawing';

// adds styles for react-mathquill
addStyles();

export interface DataItem {
    enabled: boolean;
    text: string;
    type: string;
}

const DEFAULT_DATA_ITEM: DataItem = {
    enabled: true,
    text: '',
    type: 'doc',
};

const broadcastUpdates = _.debounce((text: string, syncClient: SyncClient) => {
    let doc = syncClient.getDoc();
    if (doc) {
        let newDoc = getUpdatedDocFromText(doc, text);
        syncClient.syncDoc(newDoc);
    }
}, 100);

export const CollaborativeEditor = () => {
    const client = useFluenceClient()!;
    const [list, setList] = useState<DataItem[] | null>(null);
    const [text, setText] = useState<string | null>(null);
    const [syncClient, setSyncClient] = useState(new SyncClient());
    const [height, setHeight] = useState(300);
    const [viewerRef, onChange] = useRealtimeViewer();
    const [dataURL, setDataURL] = useState('');

    const [drawerRef] = useRealtimeDrawer({
        color: 'black',
        onChange,
    });

    function updateListIndex(newItem: string | null, index: number) {
        let newList;
        if (list === null) newList = null;
        else newList = [...list];

        newList[index].text = newItem;

        return updateList(newList);
    }

    function appendToList(newItemType: string) {
        let newList;
        if (list === null) return null;
        else newList = [...list];

        if (newItemType == 'drawing') {
        }

        newList.push({ ...DEFAULT_DATA_ITEM, type: newItemType });

        return updateList(newList);
    }

    function updateList(newList: DataItem[]) {
        setList(newList);
        const newText = JSON.stringify(newList);
        setText(newText);
        return newText;
    }

    function parseToList(newText: string): void {
        if (!newText) newText = JSON.stringify([DEFAULT_DATA_ITEM]);

        setText(newText);
        console.log(newText);
        const newList = JSON.parse(newText);
        setList(newList);
    }

    useEffect(() => {
        syncClient.handleDocUpdate = (doc) => {
            parseToList(doc.text.toString());
        };

        syncClient.handleSendChanges = (changes: string) => {
            api.addEntry(client, changes);
        };

        const unsub = subscribeToEvent(client, fluentPadServiceId, notifyTextUpdateFnName, (args, tetraplets) => {
            const [authorPeerId, changes, isAuthorized] = args as [PeerIdB58, string, boolean];
            if (authorPeerId === client.selfPeerId) {
                return;
            }

            if (changes) {
                syncClient.receiveChanges(changes);
            }
        });

        var canvas = document.getElementById('canvas') as HTMLCanvasElement;

        if (canvas != null) {
            setDataURL(canvas.toDataURL());
        }

        syncClient.start();

        // don't block
        api.getHistory(client).then((res) => {
            for (let e of res) {
                syncClient.receiveChanges(e.body);
            }

            if (syncClient.getDoc() === undefined) {
                syncClient.syncDoc(initDoc());
            }
        });

        return () => {
            unsub();
            syncClient.stop();
        };
    }, []);

    const handleTextUpdate = (itemText: string, index: number) => {
        const newText = updateListIndex(itemText, index);
        broadcastUpdates(newText, syncClient);
    };

    const handleImgUpdate = (itemImg: string, index: number) => {
        const newImg = updateListIndex(itemImg, index);
        broadcastUpdates(newImg, syncClient);
    };

    return (
        <div>
            {list ? (
                list.map((item, index) => {
                    switch (item.type) {
                        case 'latex':
                            return (
                                <div style={{width: "99%", marginBottom: "10px", marginTop: "10px"}}>
                                    <EditableMathField
                                        latex={item.text}
                                        onChange={(mathField) => handleTextUpdate(mathField.latex(), index)}
                                    />
                                </div>
                            );
                        case 'drawing':
                            return (
                                <div style={{border: "1px black solid", marginTop: "10px", marginBottom: "10px"}}>
                                    <DrawingBoard height={height} onChnge={(e) => handleImgUpdate(dataURL, index)} />
                                </div>
                            );
                        case 'doc':
                        default:
                            return (
                                <textarea
                                    spellCheck={false}
                                    className="code-editor"
                                    disabled={item.text === null}
                                    value={item.text ?? ''}
                                    style={{width: "99.8%", marginTop: "10px", marginBottom: "10px", border: "1px black solid"}}
                                    onChange={(e) => handleTextUpdate(e.target.value, index)}
                                />
                            );
                    }
                })
            ) : (
                <p> Loading data... </p>
            )}
            <div className="add-code-section-buttons">
                <button className="add-code-section" onClick={() => appendToList('doc')}>
                    &#x1F4DD;
                </button>
                <button
                    className="add-code-section"
                    onClick={() => appendToList('latex')}
                    style={{ fontSize: '0.8em' }}
                >
                    1+1
                </button>
                <button
                    className="add-code-section"
                    onClick={() => {
                        appendToList('drawing');
                    }}
                    style={{ fontSize: '1.3em' }}
                >
                    &#9999;
                </button>
            </div>
        </div>
    );
};
