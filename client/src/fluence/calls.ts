import { fluenceClient } from '.';
import { historyServiceId, servicesNodePid, userListServiceId } from './constants';

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

export const joinRoom = async (nickName: string) => {
    let joinRoomAir = `
    (seq 
        (call node (userlist "join") [user])
        (call node (userlist "get_users") [] currentUsers)
    )`;

    const data = new Map();
    data.set('user', {
        name: nickName,
        peer_id: fluenceClient.selfPeerId.toB58String(),
        relay_id: fluenceClient.relayPeerID.toB58String(),
    });
    data.set('userlist', userListServiceId);
    data.set('node', servicesNodePid);

    const [result] = await fluenceClient.fetch<[GetUsersResult]>(joinRoomAir, ['currentUsers'], data);
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
    return result.messages;
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
