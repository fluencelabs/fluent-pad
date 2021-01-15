import * as Automerge from 'automerge';
import DiffMatchPatch from 'diff-match-patch';
import { useEffect, useRef, useState } from 'react';
import { fluentPadServiceId, notifyTextUpdateFnName } from 'src/fluence/constants';
import { useFluenceClient } from './FluenceClientContext';
import * as calls from 'src/fluence/calls';
import { FluenceClient, subscribeToEvent } from '@fluencelabs/fluence';
import _ from 'lodash';

interface TextDoc {
    value: Automerge.Text;
}

const dmp = new DiffMatchPatch();

const getUpdatedDocFromText = (oldDoc: TextDoc | null, newText: string) => {
    const prevText = oldDoc ? oldDoc.value.toString() : '';
    const diff = dmp.diff_main(prevText, newText);
    dmp.diff_cleanupSemantic(diff);
    const patches = dmp.patch_make(prevText, diff);

    const newDoc = Automerge.change(oldDoc, (doc) => {
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

    return newDoc;
};

const parseState = (entry: string) => {
    try {
        return JSON.parse(entry);
    } catch (e) {
        console.log('couldnt parse state format: ' + entry);
        return null;
    }
};

const applyStates = (startingDoc: TextDoc | null, entries: calls.Entry[]) => {
    let res = startingDoc;
    for (let entry of entries) {
        const state = parseState(entry.body) as TextDoc;
        if (state) {
            if (!res) {
                res = state;
            } else {
                res = Automerge.merge(res, state);
            }
        }
    }

    if (res === null) {
        res = Automerge.from({
            value: new Automerge.Text(),
        });
    }

    return res;
};

const broadcastUpdates = _.debounce(async (client: FluenceClient, doc: TextDoc) => {
    const entry = {
        fluentPadState: Automerge.save(doc),
    };
    const entryStr = JSON.stringify(entry);

    await calls.addEntry(client, entryStr);
}, 200);

export const CollaborativeEditor = () => {
    const client = useFluenceClient()!;
    const [text, setText] = useState('');
    // const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const docSetRef = useRef(new Automerge.DocSet<TextDoc>());
    const [amConnection, setAmConnection] = useState<any>();

    useEffect(() => {
        const doc = Automerge.from({ value: new Automerge.Text() });
        docSetRef.current.setDoc('doc', doc);
        docSetRef.current.registerHandler((id, doc) => {
            if (id === 'doc') {
                setText(doc.value.toString());
            }
        });
        const connection = new Automerge.Connection(docSetRef.current, (msg) => {
            console.log('on update');
            calls.addEntry(client, JSON.stringify(msg));
        });
        connection.open();
        setAmConnection(connection);

        const unsub1 = subscribeToEvent(client, fluentPadServiceId, notifyTextUpdateFnName, (args, tetraplets) => {
            const [authorPeerId, stateStr, isAuthorized] = args;
            if (authorPeerId === client.selfPeerId.toB58String()) {
                return;
            }

            const state = parseState(stateStr);
            console.log(state);
            if (state) {
                connection.receiveMsg(state);
            }
        });

        // don't block
        calls.getHistory(client).then((res) => {
            for (let e of res) {
                try {
                    const msg = JSON.parse(e.body);
                    connection.receiveMsg(msg);
                } catch (e) {
                    console.log("history didn't work", e);
                }
            }
            // setText(newDoc);
        });

        return () => {
            unsub1();
        };
    }, []);

    // const amHistory = text
    //     ? Automerge.getHistory(text).map((x) => {
    //           return x.snapshot.value;
    //       })
    //     : [];

    // const textValue = text ? text.value : '';

    const handleTextUpdate = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);

        let doc = docSetRef.current.getDoc('doc');
        if (doc) {
            let res = getUpdatedDocFromText(doc, e.target.value);
            console.log(res);
            docSetRef.current.setDoc('doc', res!);
        }
    };

    return (
        <div>
            <textarea value={text} onChange={handleTextUpdate} />
            <div>
                Automerge changes:
                <ul>
                    {/* {amHistory.map((value, index) => (
                        <li key={index}>{value}</li>
                    ))} */}
                </ul>
            </div>
        </div>
    );
};
