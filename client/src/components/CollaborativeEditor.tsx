import _ from 'lodash';
import { useEffect, useState } from 'react';
import { subscribeToEvent } from '@fluencelabs/fluence';

import { fluentPadServiceId, notifyTextUpdateFnName } from 'src/app/constants';
import { useFluenceClient } from '../app/FluenceClientContext';
import { getUpdatedDocFromText, initDoc, SyncClient } from '../app/sync';
import * as calls from 'src/app/api';

const broadcastUpdates = _.debounce((text: string, syncClient: SyncClient) => {
    let doc = syncClient.getDoc();
    if (doc) {
        let newDoc = getUpdatedDocFromText(doc, text);
        syncClient.syncDoc(newDoc);
    }
}, 100);

export const CollaborativeEditor = () => {
    const client = useFluenceClient()!;
    const [text, setText] = useState('');
    const [syncClient, setSyncClient] = useState(new SyncClient());

    useEffect(() => {
        syncClient.syncDoc(initDoc());
        syncClient.handleDocUpdate = (doc) => {
            console.log('syncClient.handleDocUpdate');
            setText(doc.text.toString());
        };

        syncClient.handleSendChanges = (changes: string) => {
            console.log('syncClient.handleSendChanges');
            calls.addEntry(client, changes);
        };

        const unsub = subscribeToEvent(client, fluentPadServiceId, notifyTextUpdateFnName, (args, tetraplets) => {
            const [authorPeerId, changes, isAuthorized] = args;
            if (authorPeerId === client.selfPeerId.toB58String()) {
                return;
            }

            if (changes) {
                syncClient.receiveChanges(changes);
            }
        });

        syncClient.start();

        // don't block
        calls.getHistory(client).then((res) => {
            for (let e of res) {
                syncClient.receiveChanges(e.body);
            }
        });

        return () => {
            unsub();
            syncClient.stop();
        };
    }, []);

    const handleTextUpdate = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setText(newText);
        broadcastUpdates(newText, syncClient);
    };

    return <textarea spellCheck={false} className="code-editor" value={text} onChange={handleTextUpdate} />;
};
