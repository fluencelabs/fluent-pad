import _ from 'lodash';
import { useEffect, useState } from 'react';
import { PeerIdB58, subscribeToEvent } from '@fluencelabs/fluence';

import { fluentPadServiceId, notifyTextUpdateFnName } from 'src/app/constants';
import { useFluenceClient } from '../app/FluenceClientContext';
import { getUpdatedDocFromText, initDoc, SyncClient } from '../app/sync';
import { withErrorHandlingAsync } from './util';
import { addEntry, getHistory } from 'src/aqua/app';

const broadcastUpdates = _.debounce((text: string, syncClient: SyncClient) => {
    let doc = syncClient.getDoc();
    if (doc) {
        let newDoc = getUpdatedDocFromText(doc, text);
        syncClient.syncDoc(newDoc);
    }
}, 100);

export const CollaborativeEditor = () => {
    const client = useFluenceClient()!;
    const [text, setText] = useState<string | null>(null);
    const [syncClient, setSyncClient] = useState(new SyncClient());

    useEffect(() => {
        syncClient.handleDocUpdate = (doc) => {
            setText(doc.text.toString());
        };

        syncClient.handleSendChanges = (changes: string) => {
            withErrorHandlingAsync(async () => {
                const res = await addEntry(client, changes);
                if (res.ret_code !== 0) {
                    throw new Error(
                        `Failed to add message to history service, code=${res.ret_code}, message=${res.err_msg}`,
                    );
                }
            });
        };

        const unsub = subscribeToEvent(client, fluentPadServiceId, notifyTextUpdateFnName, (args, tetraplets) => {
            const [changes, isAuthorized] = args as [string, boolean];

            if (changes) {
                syncClient.receiveChanges(changes);
            }
        });

        syncClient.start();

        // don't block
        withErrorHandlingAsync(async () => {
            const res = await getHistory(client);
            for (let e of res.entries) {
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

    const handleTextUpdate = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        setText(newText);
        broadcastUpdates(newText, syncClient);
    };

    return (
        <textarea
            spellCheck={false}
            className="code-editor"
            disabled={text === null}
            value={text ?? ''}
            onChange={handleTextUpdate}
        />
    );
};
