import _ from 'lodash';
import { useEffect, useState } from 'react';
import { subscribeToEvent } from '@fluencelabs/fluence';

import { fluentPadServiceId, notifyTextUpdateFnName } from 'src/app/constants';
import { useFluenceClient } from '../app/FluenceClientContext';
import { getUpdatedDocFromText, initDoc, SyncClient } from '../app/sync';
import * as api from 'src/app/api';

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
            setText(doc.text.toString());
        };

        syncClient.handleSendChanges = (changes: string) => {
            api.addEntry(client, changes);
        };

        const unsub = subscribeToEvent(client, fluentPadServiceId, notifyTextUpdateFnName, (args, tetraplets) => {
            const [authorPeerId, changes, isAuthorized] = args as [api.PeerId, string, boolean];
            if (authorPeerId === client.selfPeerId.toB58String()) {
                return;
            }

            if (changes) {
                syncClient.receiveChanges(changes);
            }
        });

        syncClient.start();

        // don't block
        api.getHistory(client).then((res) => {
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
