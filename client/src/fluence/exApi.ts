import { FluenceClient } from '@fluencelabs/fluence';
import { SecurityTetraplet } from '@fluencelabs/fluence/dist/internal/commonTypes';

const defaultTtl = 7000;

export class Particle {
    script: string;
    data: Map<string, any>;
    ttl: number;

    constructor(script: string, data?: Map<string, any> | Record<string, any>, ttl?: number) {
        this.script = script;
        if (data === undefined) {
            this.data = new Map();
        } else if (data instanceof Map) {
            this.data = data;
        } else {
            this.data = new Map();
            for (let k in data) {
                this.data.set(k, data[k]);
            }
        }

        this.ttl = ttl ?? defaultTtl;
    }
}

export const sendParticle = async (client: FluenceClient, particle: Particle): Promise<string> => {
    return await client.sendScript(particle.script, particle.data, particle.ttl);
};

export const registerServiceFunction = (
    client: FluenceClient,
    serviceId: string,
    fnName: string,
    handler: (args: any[], tetraplets: SecurityTetraplet[][]) => object,
) => {
    client.registerCallback(serviceId, fnName, handler);
};

// prettier-ignore
export const unregisterServiceFunction = (
    client: FluenceClient,
    serviceId: string,
    fnName: string
) => {
    client.unregisterCallback(serviceId, fnName);
};

export const subscribeToEvent = (
    client: FluenceClient,
    serviceId: string,
    fnName: string,
    handler: (args: any[], tetraplets: SecurityTetraplet[][]) => void,
): Function => {
    const realHandler = (args: any[], tetraplets: SecurityTetraplet[][]) => {
        // dont' block
        setImmediate(() => {
            handler(args, tetraplets);
        });

        return {};
    };
    registerServiceFunction(client, serviceId, fnName, realHandler);
    return () => {
        unregisterServiceFunction(client, serviceId, fnName);
    };
};
