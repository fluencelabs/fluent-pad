import { FluenceClient } from '@fluencelabs/fluence';
import { fluenceClient } from '.';
import {
    fluentPadServiceId,
    historyServiceId,
    notifyOnlineFnName,
    notifyTextUpdateFnName,
    notifyUserAddedFnName,
    notifyUserRemovedFnName,
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

export const updateOnlineStatuses = async (client: FluenceClient) => {
    const particle = new Particle(
        `
        (seq
            (call myRelay ("op" "identity") [])
            (seq
                (call node (userlist "get_users") [] allUsers)
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

export const notifySelfAdded = (client: FluenceClient, name: string) => {
    const particle = new Particle(
        `
        (seq
            (call myRelay ("op" "identity") [])
            (seq
                (call node (userlist "get_users") [] allUsers)
                (fold allUsers.$.users! u
                    (par
                        (seq
                            (call u.$.relay_id ("op" "identity") [])
                            (call u.$.peer_id (fluentPadServiceId notifyUserAdded) [myUser])
                        )
                        (next u)
                    )
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
            myUser: {
                name: name,
                peer_id: client.selfPeerId.toB58String(),
                relay_id: client.relayPeerID.toB58String(),
            },
        },
    );

    sendParticle(client, particle);
};

export const getUserList = async (client: FluenceClient) => {
    const particle = new Particle(
        `
        (seq
            (call myRelay ("op" "identity") [])
            (seq
                (call node (userlist "get_users") [] allUsers)
                (seq 
                    (call myRelay ("op" "identity") [])
                    (call myPeerId (fluentPadServiceId notifyUserAdded) [allUsers.$.users!])    
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

export const joinRoom = async (client: FluenceClient, nickName: string) => {
    let joinRoomAir = `
        (call node (userlist "join") [user] result)
    `;

    const data = new Map();
    data.set('user', {
        name: nickName,
        peer_id: client.selfPeerId.toB58String(),
        relay_id: client.relayPeerID.toB58String(),
    });
    data.set('userlist', userListServiceId);
    data.set('node', servicesNodePid);

    const [result] = await client.fetch<[GetUsersResult]>(joinRoomAir, ['result'], data);
    throwIfError(result);
    return result.users;
};

export const leaveRoom = async (client: FluenceClient) => {
    const particle = new Particle(
        `
        (seq
            (call myRelay ("op" "identity") [])
            (seq 
                (call node (userlist "leave") [myPeerId])
                (seq
                    (call node (userlist "get_users") [] allUsers)
                    (fold allUsers.$.users! u
                        (par
                            (seq
                                (call u.$.relay_id ("op" "identity") [])
                                (call u.$.peer_id (fluentPadServiceId notifyUserRemoved) [myPeerId])
                            )
                            (next u)
                        )
                    )
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
            notifyUserRemoved: notifyUserRemovedFnName,
        },
    );

    await sendParticle(client, particle);
};

export const getHistory = async (client: FluenceClient) => {
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

    const [result] = await client.fetch<[GetMessagesResult]>(getHistoryAir, ['messages'], data);
    throwIfError(result);
    return result.messages;
};

export const addMessage = async (client: FluenceClient, messageBody: string) => {
    const particle = new Particle(
        `
        (seq
            (call myRelay ("op" "identity") [])
            (seq 
                (call node (userlist "is_authenticated") [] token)
                (seq
                    (call node (history "add") [message token.$.["is_authenticated"]])
                    (seq
                        (call node (userlist "get_users") [] allUsers)
                        (fold allUsers.$.users! u
                            (par
                                (seq
                                    (call u.$.relay_id ("op" "identity") [])
                                    (call u.$.peer_id (fluentPadServiceId notifyTextUpdate) [message token.$.["is_authenticated"]])
                                )
                                (next u)
                            )
                        )
                    )
                )
            )
        )
        `,
        {
            node: servicesNodePid,
            message: messageBody,
            userlist: userListServiceId,
            history: historyServiceId,
            myRelay: client.relayPeerID.toB58String(),
            myPeerId: client.selfPeerId.toB58String(),
            fluentPadServiceId: fluentPadServiceId,
            notifyTextUpdate: notifyTextUpdateFnName,
        },
    );

    await sendParticle(client, particle);
};
