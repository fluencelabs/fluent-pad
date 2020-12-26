import { build } from 'fluence/dist/particle';
import { fluenceClient, relay } from '.';
import { fluentPadProviderKey, fluentPadServiceId } from './constants';

export const registerAsFluentPadUser = async () => {
    const myPeerId = fluenceClient.selfPeerId.toB58String();
    const myRelay = fluenceClient.connection.nodePeerId.toB58String();

    let script = `
    (seq
      (seq
        (call myRelay ("dht" "add_provider") [key value])
        (call myRelay ("dht" "neighborhood") [] neighbors)
      )
      (fold neighbors n
        (seq
          (call n ("dht" "add_provider") [key value])
          (next n)
        )
      )
    )`;

    const data = new Map();
    data.set('myRelay', myRelay);
    data.set('value', { peer: myPeerId });
    data.set('key', fluentPadProviderKey);

    let particle = await build(fluenceClient.selfPeerId, script, data);
    await fluenceClient.executeParticle(particle);
};

export const debugDiscoverPeers = async () => {
    const myPeerId = fluenceClient.selfPeerId.toB58String();
    // const myRelay = fluenceClient.connection.nodePeerId.toB58String();
    const myRelay = relay.peerId;

    //   let script = `
    // (seq
    //   (seq
    //     (call myRelay ("dht" "neighborhood") [key] neighbors)
    //     (fold neighbors n
    //       (seq
    //         (call n ("dht" "get_providers") [key] providers)
    //         (next n)
    //       )
    //     )
    //   )
    //   (seq
    //     (call myRelay ("op" "identiy") [])
    //     (call %init_peer_id% ("debug" "notifyDiscovered") [providers])
    //   )
    // )`;

    let script = `
    (seq
      (call myRelay ("op" "identiy") [])
      (seq 
        (call myRelay ("op" "identiy") [])
        (call %init_peer_id% ("debug" "notifyDiscovered") [value])
      )
    )`;

    // script = `
    //  (call %init_peer_id% ("debug" "notifyDiscovered") [value])`;

    const data = new Map();
    data.set('myRelay', myRelay);
    data.set('myPeerId', myPeerId);
    data.set('value', 'hello world!');

    let particle = await build(fluenceClient.selfPeerId, script, data);
    await fluenceClient.executeParticle(particle);
};

(window as any).debugDiscoverPeers = debugDiscoverPeers;

export const discoverPeers = async () => {
    const myPeerId = fluenceClient.selfPeerId.toB58String();
    const myRelay = fluenceClient.connection.nodePeerId.toB58String();

    let script = `
    (seq
      (seq
        (call myRelay ("dht" "neighborhood") [key] neighbors)
        (fold neighbors n
          (seq
            (call n ("dht" "get_providers") [key] providers)
            (next n)
          )
        )
      )
      (fold providers p
        (seq
          (seq
            (call p.$.peer (serviceId "discover") [] discovery_result)
            (seq 
              (call myRelay ("op" "identiy") [])
              (call %init_peer_id% (serviceId "notifyDiscovered") [discovery_result])                  
            )
          )
          (next p)
        )
      )
    )`;

    const data = new Map();
    data.set('serviceId', fluentPadServiceId);
    data.set('myRelay', myRelay);
    data.set('myPeerId', myPeerId);
    data.set('key', fluentPadProviderKey);

    let particle = await build(fluenceClient.selfPeerId, script, data);
    await fluenceClient.executeParticle(particle);
};

export const notifyNameChanged = async (remoteRelay: string, remotePeer: string, newName: string) => {
    const myPeerId = fluenceClient.selfPeerId.toB58String();
    const myRelay = fluenceClient.connection.nodePeerId.toB58String();

    let script = `
    (seq 
      (call myRelay ("op" "identity") [])
      (seq 
        (call remoteRelay ("op" "identity") [])
        (call remotePeer (serviceId "notifyNameChanged") [myPeerId newName])
      )
    )`;

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
      (seq
        (call remoteRelay ("op" "identity") [])
        (call remotePeer (serviceId "notifyDisconnected") [myPeerInfo])
      )
    )`;

    const data = new Map();
    data.set('serviceId', fluentPadServiceId);
    data.set('remoteRelay', remoteRelay);
    data.set('remotePeer', remotePeer);
    data.set('myPeerInfo', { peerId: myPeerId, relayId: myRelay });

    let particle = await build(fluenceClient.selfPeerId, script, data);
    await fluenceClient.executeParticle(particle);
};
