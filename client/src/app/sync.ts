import { from, Connection, Doc, DocSet, Text, Message, change } from 'automerge';
import DiffMatchPatch from 'diff-match-patch';

export interface TextDoc {
    text: Text;
}

export const initDoc = () => {
    return from({
        text: new Text(),
    });
};

export class SyncClient<T = TextDoc> {
    private static globalDocId = 'fluent-pad-doc';

    private docSet: DocSet<T>;
    private connection: Connection<T>;

    constructor() {
        this.docSet = new DocSet<T>();
        this.connection = new Connection<T>(this.docSet, this.doSendMessage.bind(this));
        this.docSet.registerHandler(this.doHandleDocUpdate.bind(this));
    }

    start() {
        this.connection.open();
    }

    stop() {
        this.connection.close();
    }

    getDoc() {
        return this.docSet.getDoc(SyncClient.globalDocId);
    }

    syncDoc(doc: Doc<T>) {
        this.docSet.setDoc(SyncClient.globalDocId, doc);
    }

    receiveChanges(changes: string) {
        try {
            const msg = JSON.parse(changes);
            this.connection.receiveMsg(msg);
        } catch (e) {
            console.error('Couldnt receive message', changes);
        }
    }

    handleDocUpdate?: (doc: Doc<T>) => void;

    handleSendChanges?: (changes: string) => void;

    private doSendMessage(msg: Message) {
        if (this.handleSendChanges) {
            const body = JSON.stringify(msg);
            this.handleSendChanges(body);
        }
    }

    private doHandleDocUpdate(docId: string, doc: Doc<T>) {
        if (docId === SyncClient.globalDocId && this.handleDocUpdate) {
            this.handleDocUpdate(doc);
        }
    }
}

const dmp = new DiffMatchPatch();

export const getUpdatedDocFromText = (oldDoc: TextDoc, newText: string) => {
    const prevText = oldDoc.text.toString();
    const diff = dmp.diff_main(prevText, newText);
    dmp.diff_cleanupSemantic(diff);
    const patches = dmp.patch_make(prevText, diff);

    const newDoc = change(oldDoc, (doc) => {
        patches.forEach((patch) => {
            let idx = patch.start1;
            patch.diffs.forEach(([operation, changeText]) => {
                switch (operation) {
                    case 1: // Insertion
                        doc.text.insertAt!(idx, ...changeText.split(''));
                        break;
                    case 0: // No Change
                        idx += changeText.length;
                        break;
                    case -1: // Deletion
                        for (let i = 0; i < changeText.length; i++) {
                            doc.text.deleteAt!(idx);
                        }
                        break;
                }
            });
        });
    });

    return newDoc;
};
