import { FluenceClient } from '@fluencelabs/fluence';
import { fluenceClient } from '.';
import {
    fluentPadServiceId,
    historyServiceId,
    notifyOnlineFnName,
    notifyUserAddedFnName,
    servicesNodePid,
    userListServiceId,
} from './constants';
import { Particle, sendParticle } from './exApi';

export interface ServiceResult {
    ret_code: number;
    err_msg: string;
}

export interface User {
    peer_id: string;
    relay_id: string;
    name: string;
}

export interface Message {
    id: number;
    body: string;
}

interface GetUsersResult extends ServiceResult {
    users: Array<User>;
}

interface GetMessagesResult extends ServiceResult {
    messages: Message[];
}

const throwIfError = (result: ServiceResult) => {
    if (result.ret_code !== 0) {
        throw new Error(result.err_msg);
    }
};

const notifyOnlineStatusesAir = `
    (fold allUsers.$.users! u
        (par
            (seq
                (call u.$.relay_id ("op" "identity") [])
                (seq
                    (call u.$.peer_id ("op" "identity") [])
                    (seq
                        (call u.$.relay_id ("op" "identity") [])
                        (seq
                            (call myRelay ("op" "identity") [])
                            (call myPeerId (fluentPadServiceId notifyOnline) [u.$.peer_id immediately])
                        )
                    )
                )
            )
            (next u)
        )
    )
`;

export const updateOnlineStatuses = async (client: FluenceClient) => {
    const particle = new Particle(
        `
        (seq
            (call myRelay ("op" "identity") [])
            (seq
                (call node (userlist "get_users") [] allUsers)
                ${notifyOnlineStatusesAir}
            )
        )
        `,
        {
            node: servicesNodePid,
            userlist: userListServiceId,
            myRelay: client.relayPeerID.toB58String(),
            myPeerId: client.selfPeerId.toB58String(),
            fluentPadServiceId: fluentPadServiceId,
            notifyOnline: notifyOnlineFnName,
            immediately: false,
        },
    );

    sendParticle(client, particle);
};

export const getInitialUserList = async (client: FluenceClient) => {
    const particle = new Particle(
        `
        (seq
            (call myRelay ("op" "identity") [])
            (seq
                (call node (userlist "get_users") [] allUsers)
                (par
                    (seq 
                        (call myRelay ("op" "identity") [])
                        (call myPeerId (fluentPadServiceId notifyUserAdded) [allUsers.$.users!])    
                    )
                    ${notifyOnlineStatusesAir}
                )
            )
        )
        `,
        {
            node: servicesNodePid,
            userlist: userListServiceId,
            myRelay: client.relayPeerID.toB58String(),
            myPeerId: client.selfPeerId.toB58String(),
            fluentPadServiceId: fluentPadServiceId,
            notifyUserAdded: notifyUserAddedFnName,
            immediately: true,
        },
    );

    await sendParticle(client, particle);
};

export const joinRoom = async (nickName: string) => {
    let joinRoomAir = `
        (call node (userlist "join") [user] result)
    `;

    const data = new Map();
    data.set('user', {
        name: nickName,
        peer_id: fluenceClient.selfPeerId.toB58String(),
        relay_id: fluenceClient.relayPeerID.toB58String(),
    });
    data.set('userlist', userListServiceId);
    data.set('node', servicesNodePid);

    const [result] = await fluenceClient.fetch<[GetUsersResult]>(joinRoomAir, ['result'], data);
    throwIfError(result);
    return result.users;
};

export const leaveRoom = async () => {
    let leaveRoomAir = `
        (call node (userlist "leave") [ownPeerId] callResult)
    `;

    const data = new Map();
    data.set('ownPeerId', fluenceClient.selfPeerId.toB58String());
    data.set('userlist', userListServiceId);
    data.set('node', servicesNodePid);

    const [result] = await fluenceClient.fetch<[ServiceResult]>(leaveRoomAir, ['callResult'], data);
    throwIfError(result);
    return result;
};

export const removeUser = async (userPeerId: string) => {
    let removeUserAir = `
        (call node (userlist "leave") [userPeerId] callResult)
    `;

    const data = new Map();
    data.set('userPeerId', userPeerId);
    data.set('userlist', userListServiceId);
    data.set('node', servicesNodePid);

    const [result] = await fluenceClient.fetch<[ServiceResult]>(removeUserAir, ['callResult'], data);
    throwIfError(result);
    return result;
};

export const getHistory = async () => {
    let getHistoryAir = `
    (seq
        (call node (userlist "is_authenticated") [] token)
        (call node (history "get_all") [] messages)
    )
`;

    const data = new Map();
    data.set('userlist', userListServiceId);
    data.set('history', historyServiceId);
    data.set('node', servicesNodePid);

    const [result] = await fluenceClient.fetch<[GetMessagesResult]>(getHistoryAir, ['messages'], data);
    throwIfError(result);
    return result.messages;
};

export const getCurrentUsers = async () => {
    let getUsersAir = `
        (call node (userlist "get_users") [] currentUsers)
    `;

    const data = new Map();
    data.set('userlist', userListServiceId);
    data.set('node', servicesNodePid);

    const [result] = await fluenceClient.fetch<[GetUsersResult]>(getUsersAir, ['currentUsers'], data);
    throwIfError(result);
    return result.users;
};

export const addMessage = async (messageBody: string) => {
    let addMessageAir = `
    (seq
        (call node (userlist "is_authenticated") [] token)
        (call node (history "add") [message token.$.["is_authenticated"]] callResult)
    )
`;

    const data = new Map();
    data.set('message', messageBody);
    data.set('userlist', userListServiceId);
    data.set('history', historyServiceId);
    data.set('node', servicesNodePid);

    const [result] = await fluenceClient.fetch<[ServiceResult]>(addMessageAir, ['callResult'], data);
    if (result.ret_code !== 0) {
        throw new Error(result.err_msg);
    }
    return result;
};

export const notifyPeer = async <T>(peerId: string, peerRelayId: string, channel: string, event: string, data?: T) => {
    let addMessageAir = `
    (seq
        (call peerRelayId ("op" "identity") [])
        (call peerId (channel event) [${data ? 'data' : ''}])
    )
`;

    const particleData = new Map();
    particleData.set('peerId', peerId);
    particleData.set('peerRelayId', peerRelayId);
    particleData.set('channel', channel);
    particleData.set('event', event);
    if (data) {
        particleData.set('data', data);
    }

    await fluenceClient.fireAndForget(addMessageAir, particleData);
};

export const notifyPeers = async <T>(
    peers: Array<{ peer_id: string; relay_id: string; name: string }>,
    channel: string,
    event: string,
    data?: T,
) => {
    for (let p of peers) {
        notifyPeer(p.peer_id, p.relay_id, channel, event, data);
    }
};
