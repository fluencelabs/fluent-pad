import { FluenceClient, Particle, sendParticle, sendParticleAsFetch } from '@fluencelabs/fluence';

import {
    fluentPadServiceId,
    notifyTextUpdateFnName,
    notifyUserAddedFnName,
    notifyUserRemovedFnName,
    history,
    userList,
    notifyOnlineFnName,
} from './constants';

export interface ServiceResult {
    ret_code: number;
    err_msg: string;
}

export interface User {
    peer_id: string;
    relay_id: string;
    name: string;
}

export interface Entry {
    id: number;
    body: string;
}

interface GetUsersResult extends ServiceResult {
    users: Array<User>;
}

interface GetEntriesResult extends ServiceResult {
    entries: Entry[];
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
                (call userlistNode (userlist "get_users") [] allUsers)
                (fold allUsers.$.users! u
                    (par
                        (seq
                            (call u.$.relay_id! ("peer" "is_connected") [u.$.peer_id!] isOnline)
                            (seq
                                (call myRelay ("op" "identity") [])
                                (call myPeerId (fluentPadServiceId notifyOnline) [u.$.peer_id! isOnline])
                            )
                        )
                        (next u)
                    )
                )
            )
        )
        `,
        {
            userlistNode: userList.node,
            userlist: userList.id,
            myRelay: client.relayPeerId,
            myPeerId: client.selfPeerId,
            fluentPadServiceId: fluentPadServiceId,
            notifyOnline: notifyOnlineFnName,
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
                (call userlistNode (userlist "get_users") [] allUsers)
                (fold allUsers.$.users! u
                    (par
                        (seq
                            (call u.$.relay_id! ("op" "identity") [])
                            (call u.$.peer_id! (fluentPadServiceId notifyUserAdded) [myUser true])
                        )
                        (next u)
                    )
                )
            )
        )
        `,
        {
            userlistNode: userList.node,
            userlist: userList.id,
            myRelay: client.relayPeerId,
            myPeerId: client.selfPeerId,
            fluentPadServiceId: fluentPadServiceId,
            notifyUserAdded: notifyUserAddedFnName,
            myUser: {
                name: name,
                peer_id: client.selfPeerId,
                relay_id: client.relayPeerId,
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
                (call userlistNode (userlist "get_users") [] allUsers)
                (fold allUsers.$.users! u
                    (par
                        (seq
                            (call u.$.relay_id! ("op" "identity") [])
                            (seq
                                (call u.$.relay_id! ("peer" "is_connected") [u.$.peer_id!] isOnline)
                                (seq 
                                    (call myRelay ("op" "identity") [])
                                    (call myPeerId (fluentPadServiceId notifyUserAdded) [u isOnline])
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
            userlistNode: userList.node,
            userlist: userList.id,
            myRelay: client.relayPeerId,
            myPeerId: client.selfPeerId,
            fluentPadServiceId: fluentPadServiceId,
            notifyUserAdded: notifyUserAddedFnName,
        },
    );

    await sendParticle(client, particle);
};

export const join = async (client: FluenceClient, nickName: string) => {
    const particle = new Particle(
        `
            (seq
                (call myRelay ("op" "identity") [])
                (seq
                    (call userlistNode (userlist "join") [user] result)
                    (seq
                        (call myRelay ("op" "identity") [])
                        (call myPeerId ("_callback" "join") [result])
                    )
                )
            )
        `,
        {
            myRelay: client.relayPeerId,
            myPeerId: client.selfPeerId,
            user: {
                name: nickName,
                peer_id: client.selfPeerId,
                relay_id: client.relayPeerId,
            },
            userlistNode: userList.node,
            userlist: userList.id,
        },
    );

    const [result] = await sendParticleAsFetch<[ServiceResult]>(client, particle, 'join');
    throwIfError(result);
};

export const leave = async (client: FluenceClient) => {
    const particle = new Particle(
        `
        (seq
            (call myRelay ("op" "identity") [])
            (seq 
                (call userlistNode (userlist "leave") [myPeerId])
                (seq
                    (call userlistNode (userlist "get_users") [] allUsers)
                    (fold allUsers.$.users! u
                        (par
                            (seq
                                (call u.$.relay_id! ("op" "identity") [])
                                (call u.$.peer_id! (fluentPadServiceId notifyUserRemoved) [myPeerId])
                            )
                            (next u)
                        )
                    )
                )
            )
        )
        `,
        {
            userlistNode: userList.node,
            userlist: userList.id,
            myRelay: client.relayPeerId,
            myPeerId: client.selfPeerId,
            fluentPadServiceId: fluentPadServiceId,
            notifyUserRemoved: notifyUserRemovedFnName,
        },
    );

    await sendParticle(client, particle);
};

export const getHistory = async (client: FluenceClient) => {
    const particle = new Particle(
        `
            (seq
                (call myRelay ("op" "identity") [])
                (seq
                    (call userlistNode (userlist "is_authenticated") [] token)
                    (seq
                        (call historyNode (history "get_all") [token.$.["is_authenticated"]] entries)
                        (seq
                            (call myRelay ("op" "identity") [])
                            (call myPeerId ("_callback" "get_history") [entries])
                        )
                    )
                )
            )
        `,
        {
            myRelay: client.relayPeerId,
            myPeerId: client.selfPeerId,
            userlistNode: userList.node,
            userlist: userList.id,

            historyNode: history.node,
            history: history.id,
        },
    );

    const [result] = await sendParticleAsFetch<[GetEntriesResult]>(client, particle, 'get_history');
    throwIfError(result);
    return result.entries;
};

export const addEntry = async (client: FluenceClient, entry: string) => {
    const particle = new Particle(
        `
        (seq
            (call myRelay ("op" "identity") [])
            (seq
                (call userlistNode (userlist "is_authenticated") [] token)
                (seq 
                    (call userlistNode (userlist "get_users") [] allUsers)
                    (seq
                        (call historyNode (history "add") [entry token.$.["is_authenticated"]])
                        (fold allUsers.$.users! u
                            (par
                                (seq
                                    (call u.$.relay_id! ("op" "identity") [])
                                    (call u.$.peer_id! (fluentPadServiceId notifyTextUpdate) [myPeerId entry token.$.["is_authenticated"]])
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
            userlistNode: userList.node,
            userlist: userList.id,
            historyNode: history.node,
            history: history.id,
            entry: entry,
            myRelay: client.relayPeerId,
            myPeerId: client.selfPeerId,
            fluentPadServiceId: fluentPadServiceId,
            notifyTextUpdate: notifyTextUpdateFnName,
        },
    );

    await sendParticle(client, particle);
};
