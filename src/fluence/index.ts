import Fluence from 'fluence';
import { FluenceClient } from 'fluence/dist/fluenceClient';
import { registerService } from 'fluence/dist/globalState';
import { peerIdToSeed, seedToPeerId } from 'fluence/dist/seed';
import { ServiceMultiple, ServiceOne } from 'fluence/dist/service';
import { faasNetHttps, dev } from './environments';

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

const registerDebugStuff = async (c) => {
    (window as any).fluenceClient = c;

    const s = new ServiceOne('debug', (fnName: string, args: any[], _tetraplets) => {
        console.log(fnName + ' called with args: ', args);
        return {};
    });

    const op = new ServiceMultiple('op');
    op.registerFunction('identity', (args: any[], _tetraplets) => {
        return args;
    });

    registerService(op);
    registerService(s);
};

export const relay = dev[0];

export const connect = async () => {
    if (fluenceClient) {
        return fluenceClient;
    }

    const node = relay;
    const key = await getPrivKey();
    const peerId = await seedToPeerId(key);
    const c = await Fluence.connect(node.multiaddr);

    fluenceClient = c;

    await registerDebugStuff(c);

    return fluenceClient;
};

export const disconnect = async () => {
    if (fluenceClient) {
        await fluenceClient.disconnect();
    }
};
