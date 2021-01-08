import { FluenceClient } from 'fluence/dist/fluenceClient';
import { ServiceMultiple } from 'fluence/dist/service';
import { registerService as register, deleteService as unregister } from 'fluence/dist/globalState';
import { fluentPadServiceId } from './constants';
import { SecurityTetraplet } from 'fluence/dist/securityTetraplet';
import * as calls from './calls';

type Event = 'newConnected' | 'disconnected' | 'nameChanged';

export interface ClientInFluence {
    peerId: string;
    relayId: string;
}

export interface FluentPadClientPeer extends ClientInFluence {
    nickname: string;
}

export class FluentPadService extends ServiceMultiple {
    private nickname;
    private client: FluenceClient;

    private get ownPeerInfo(): ClientInFluence {
        return {
            peerId: this.client.selfPeerIdStr,
            relayId: this.client.connection.nodePeerId.toB58String(),
        };
    }

    private peers: Array<FluentPadClientPeer>;

    private subscriptions = new Map<Event, Array<Function>>([
        ['newConnected', []],
        ['disconnected', []],
        ['nameChanged', []],
    ]);

    constructor(client: FluenceClient, nickname: string) {
        super(fluentPadServiceId);

        this.client = client;
        this.nickname = nickname;
        this.peers = [];
    }

    // public

    async changeNickname(nickname: string) {
        this.nickname = nickname;

        this.notifyPeers((x) => {
            calls.notifyNameChanged(x.relayId, x.peerId, nickname);
        });
    }

    async connect(): Promise<void> {
        this.registerService();
        await calls.discoverPeers();
    }

    async disconnect(): Promise<void> {
        this.notifyPeers((x) => {
            calls.notifyDisconnected(x.relayId, x.peerId);
        });

        this.deleteService();
    }

    on(event: Event, handler: Function) {
        this.subscriptions.get(event)!.push(handler);
    }

    // private

    private fireOn(event: Event, ...args) {
        const subscribers = this.subscriptions.get(event)!;
        for (let subscriber of subscribers) {
            subscriber.apply(args);
        }
    }

    private reconcilePeers(newPeers: FluentPadClientPeer[]) {
        for (let newPeer of newPeers) {
            if (newPeer.peerId === this.ownPeerInfo.peerId) {
                continue;
            }

            if (this.peers.findIndex((x) => x.peerId === newPeer.peerId) === -1) {
                continue;
            }

            this.peers.push(newPeer);
            this.fireOn('newConnected', newPeer);
        }
    }

    private removePeer(peer: FluentPadClientPeer) {
        const toRemove = this.peers.findIndex((x) => x.peerId === peer.peerId);
        if (toRemove !== -1) {
            this.fireOn('disconnected', this.peers[toRemove]);
            this.peers.splice(toRemove);
        }
    }

    private notifyPeers(fn: (peer: ClientInFluence) => void) {
        for (let peer of this.peers) {
            fn(peer);
        }
    }

    private ping(args: any[], tetraplets: SecurityTetraplet[][]) {
        return {};
    }

    private discover(args: any[], tetraplets: SecurityTetraplet[][]) {
        return {
            knownPeers: [
                ...this.peers,
                {
                    ...this.ownPeerInfo,
                    nickname: this.nickname,
                },
            ],
        };
    }

    private notifyDiscovered(args: any[], tetraplets: SecurityTetraplet[][]) {
        const peers = args[0] as {
            knownPeers: FluentPadClientPeer[];
        };
        setImmediate(this.reconcilePeers.bind(this), peers.knownPeers);
        return {};
    }

    private notifyDisconnected(args: any[], tetraplets: SecurityTetraplet[][]) {
        const peers = args[0] as FluentPadClientPeer;
        setImmediate(this.removePeer.bind(this), peers);
        return {};
    }

    private notifyNameChanged(args: any[], tetraplets: SecurityTetraplet[][]) {
        const newName = args[0] as string;
        const peerId = args[1] as string;

        setImmediate(() => {
            const peer = this.peers.find((x) => x.peerId === peerId);
            if (peer) {
                peer.nickname = newName;
            }
            this.fireOn('nameChanged', peerId, newName);
        });

        return {};
    }

    private registerService() {
        this.registerFunction('ping', this.ping.bind(this));
        this.registerFunction('discover', this.discover.bind(this));
        this.registerFunction('notifyDiscovered', this.notifyDiscovered.bind(this));
        this.registerFunction('notifyDisconnected', this.notifyDisconnected.bind(this));
        this.registerFunction('notifyNameChanged', this.notifyNameChanged.bind(this));
        register(this);
    }

    private deleteService() {
        unregister(this.serviceId);
    }
}
