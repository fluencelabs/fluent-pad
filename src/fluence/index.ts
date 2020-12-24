import Fluence from 'fluence';
import { FluenceClient } from 'fluence/dist/fluenceClient';
import { peerIdToSeed, seedToPeerId } from 'fluence/dist/seed';
import { faasNetHttps } from './environments';

const privKeyStorageKey = 'privKey';

// TODO:: security matters
const getPrivKey = async () => {
    if (localStorage.getItem(privKeyStorageKey) === null) {
        const peerId = await Fluence.generatePeerId();
        const key = peerIdToSeed(peerId);
        localStorage.setItem(privKeyStorageKey, key);
    }

    return localStorage.getItem(privKeyStorageKey)!;
};

export let fluenceClient: FluenceClient;

export const connect = async () => {
    if (fluenceClient) {
        return fluenceClient;
    }

    const node = faasNetHttps[0];
    const key = await getPrivKey();
    const peerId = await seedToPeerId(key);
    const c = await Fluence.connect(node.multiaddr, peerId);
    fluenceClient = c;
    return fluenceClient;
};

export const disconnect = async () => {
    if (fluenceClient) {
        await fluenceClient.disconnect();
    }
};
