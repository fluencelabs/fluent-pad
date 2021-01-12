import { FluenceClient, peerIdToSeed, generatePeerId, seedToPeerId } from '@fluencelabs/fluence';
import { dev } from '@fluencelabs/fluence-network-environment';

const privKeyStorageKey = 'privKey';

// TODO:: security matters
const getPrivKey = async () => {
    // return '7sHe8vxCo4BkdPNPdb8f2T8CJMgTmSvBTmeqtH9QWrar';
    const peerId = await generatePeerId();
    const key = peerIdToSeed(peerId);
    return key;

    if (localStorage.getItem(privKeyStorageKey) === null) {
        const peerId = await generatePeerId();
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

    const node = dev[0];
    const key = await getPrivKey();
    const peerId = await seedToPeerId(key);
    const c = new FluenceClient(peerId);
    await c.connect(node.multiaddr);
    fluenceClient = c;
    return fluenceClient;
};

export const disconnect = async () => {
    if (fluenceClient) {
        await fluenceClient.disconnect();
    }
};
