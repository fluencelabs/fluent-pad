import { build } from 'fluence/dist/particle';
import { fluenceClient } from '.';
import { fluentPadServiceId } from './constants';

export const discoverPeers = async () => {
    const myPeerId = fluenceClient.selfPeerId.toB58String();
    const myRelay = fluenceClient.connection.nodePeerId.toB58String();

    let script = `
    (seq 
      (call myRelay ("op" "identity") [])
      (call relayId ("dht" "neighborhood") [clientId] neigh)
      (fold neigh n
        (seq 
            (call n (serviceId "discover") [] result)
            (call myRelay ("op" "identity") [])
            (call %init_peer_id% ("op" "notifyDiscovered") [result]))))`;

    const data = new Map();
    data.set('serviceId', fluentPadServiceId);
    data.set('myRelay', myRelay);
    data.set('myPeerId', myPeerId);

    let particle = await build(fluenceClient.selfPeerId, script, data);
    await fluenceClient.executeParticle(particle);
};

export const notifyNameChanged = async (remoteRelay: string, remotePeer: string, newName: string) => {
    const myPeerId = fluenceClient.selfPeerId.toB58String();
    const myRelay = fluenceClient.connection.nodePeerId.toB58String();

    let script = `
    (seq 
      (call myRelay ("op" "identity") [])
      (call remoteRelay ("op" "identity") [])
      (call remotePeer (serviceId "notifyNameChanged") [myPeerId newName]))`;

    const data = new Map();
    data.set('serviceId', fluentPadServiceId);
    data.set('myRelay', myRelay);
    data.set('remoteRelay', remoteRelay);
    data.set('remotePeer', remotePeer);
    data.set('myPeerId', myPeerId);
    data.set('newName', newName);

    let particle = await build(fluenceClient.selfPeerId, script, data);
    await fluenceClient.executeParticle(particle);
};

export const notifyDisconnected = async (remoteRelay: string, remotePeer: string) => {
    const myPeerId = fluenceClient.selfPeerId.toB58String();
    const myRelay = fluenceClient.connection.nodePeerId.toB58String();

    let script = `
    (seq 
      (call myRelay ("op" "identity") [])
      (call remoteRelay ("op" "identity") [])
      (call remotePeer (serviceId "notifyDisconnected") [myPeerInfo]))`;

    const data = new Map();
    data.set('serviceId', fluentPadServiceId);
    data.set('remoteRelay', remoteRelay);
    data.set('remotePeer', remotePeer);
    data.set('myPeerInfo', { peerId: myPeerId, relayId: myRelay });

    let particle = await build(fluenceClient.selfPeerId, script, data);
    await fluenceClient.executeParticle(particle);
};
