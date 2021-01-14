import { FluenceClient, peerIdToSeed, generatePeerId, seedToPeerId } from '@fluencelabs/fluence';
import { dev } from '@fluencelabs/fluence-network-environment';
import log from 'loglevel';
import { registerServiceFunction } from './exApi';

log.setLevel(2);

const getPrivKey = async () => {
    // return '7sHe8vxCo4BkdPNPdb8f2T8CJMgTmSvBTmeqtH9QWrar';
    const peerId = await generatePeerId();
    const key = peerIdToSeed(peerId);
    return key;
};

export let fluenceClient: FluenceClient;

export const connect = async (): Promise<FluenceClient> => {
    if (fluenceClient) {
        return fluenceClient;
    }

    const node = dev[0];
    const key = await getPrivKey();
    const peerId = await seedToPeerId(key);
    const c = new FluenceClient(peerId);

    // missing built-in identity function
    registerServiceFunction(c, 'op', 'identity', (args, _) => {
        console.log('called identity');
        return args;
    });

    await c.connect(node.multiaddr);
    fluenceClient = c;
    return fluenceClient;
};

export const disconnect = async () => {
    if (fluenceClient) {
        await fluenceClient.disconnect();
    }
};
