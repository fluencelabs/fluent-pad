import { FluenceClient, PeerIdB58 } from '@fluencelabs/fluence';
import { RequestFlowBuilder } from '@fluencelabs/fluence/dist/api.unstable';

export async function getUserList(
    client: FluenceClient,
): Promise<{ name: string; peer_id: string; relay_id: string }[]> {
    let request;
    const promise = new Promise<{ name: string; peer_id: string; relay_id: string }[]>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (seq
  (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  (call "userlist_node" ("userlist_id" "get_users") [] allUsers)
 )
 (seq
  (call relay ("op" "identity") [])
  (call %init_peer_id% ("callbackSrv" "response") [allUsers.$.users])
 )
)

            `,
            )
            .configHandler((h) => {
                h.on('getDataSrv', 'relay', () => {
                    return client.relayPeerId;
                });
                h.on('getRelayService', 'hasReleay', () => {
                    // Not Used
                    return client.relayPeerId !== undefined;
                });

                h.on('callbackSrv', 'response', (args) => {
                    const [res] = args;
                    resolve(res);
                });

                h.on('nameOfServiceWhereToSendXorError', 'errorProbably', (args) => {
                    // assuming error is the single argument
                    const [err] = args;
                    reject(err);
                });
            })
            .handleTimeout(() => {
                reject('message for timeout');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}

export async function join(
    client: FluenceClient,
    user: { name: string; peer_id: string; relay_id: string },
    user_list: { peer_id: string; service_id: string },
): Promise<{ err_msg: string; ret_code: number }> {
    let request;
    const promise = new Promise<{ err_msg: string; ret_code: number }>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (seq
  (seq
   (seq
    (call %init_peer_id% ("getDataSrv" "user") [] user0)
    (call %init_peer_id% ("getDataSrv" "user_list") [] user_list1)
   )
   (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  )
  (call user_list.$.peer_id (user_list.$.service_id "join") [user0] res)
 )
 (seq
  (call relay ("op" "identity") [])
  (call %init_peer_id% ("callbackSrv" "response") [res])
 )
)

            `,
            )
            .configHandler((h) => {
                h.on('getDataSrv', 'relay', () => {
                    return client.relayPeerId;
                });
                h.on('getRelayService', 'hasReleay', () => {
                    // Not Used
                    return client.relayPeerId !== undefined;
                });
                h.on('getDataSrv', 'user', () => {
                    return user;
                });
                h.on('getDataSrv', 'user_list', () => {
                    return user_list;
                });
                h.on('callbackSrv', 'response', (args) => {
                    const [res] = args;
                    resolve(res);
                });

                h.on('nameOfServiceWhereToSendXorError', 'errorProbably', (args) => {
                    // assuming error is the single argument
                    const [err] = args;
                    reject(err);
                });
            })
            .handleTimeout(() => {
                reject('message for timeout');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}

export async function auth(
    client: FluenceClient,
    user_list: { peer_id: string; service_id: string },
): Promise<{ err_msg: string; is_authenticated: boolean; ret_code: number }> {
    let request;
    const promise = new Promise<{ err_msg: string; is_authenticated: boolean; ret_code: number }>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (seq
  (seq
   (call %init_peer_id% ("getDataSrv" "user_list") [] user_list0)
   (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  )
  (call user_list.$.peer_id (user_list.$.service_id "is_authenticated") [] res)
 )
 (seq
  (call relay ("op" "identity") [])
  (call %init_peer_id% ("callbackSrv" "response") [res])
 )
)

            `,
            )
            .configHandler((h) => {
                h.on('getDataSrv', 'relay', () => {
                    return client.relayPeerId;
                });
                h.on('getRelayService', 'hasReleay', () => {
                    // Not Used
                    return client.relayPeerId !== undefined;
                });
                h.on('getDataSrv', 'user_list', () => {
                    return user_list;
                });
                h.on('callbackSrv', 'response', (args) => {
                    const [res] = args;
                    resolve(res);
                });

                h.on('nameOfServiceWhereToSendXorError', 'errorProbably', (args) => {
                    // assuming error is the single argument
                    const [err] = args;
                    reject(err);
                });
            })
            .handleTimeout(() => {
                reject('message for timeout');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}

export async function getHistory(
    client: FluenceClient,
    user_list: { peer_id: string; service_id: string },
    history: { peer_id: string; service_id: string },
): Promise<{ entries: { body: string; id: number }[]; err_msg: string; ret_code: number }> {
    let request;
    const promise = new Promise<{ entries: { body: string; id: number }[]; err_msg: string; ret_code: number }>(
        (resolve, reject) => {
            request = new RequestFlowBuilder()
                .withRawScript(
                    `
(seq
 (seq
  (seq
   (seq
    (call %init_peer_id% ("getDataSrv" "user_list") [] user_list0)
    (call %init_peer_id% ("getDataSrv" "history") [] history1)
   )
   (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  )
  (seq
   (call user_list.$.peer_id (user_list.$.service_id "is_authenticated") [] res)
   (call history.$.peer_id (history.$.service_id "get_all") [res.$.is_authenticated] res11)
  )
 )
 (seq
  (call relay ("op" "identity") [])
  (call %init_peer_id% ("callbackSrv" "response") [res11])
 )
)

            `,
                )
                .configHandler((h) => {
                    h.on('getDataSrv', 'relay', () => {
                        return client.relayPeerId;
                    });
                    h.on('getRelayService', 'hasReleay', () => {
                        // Not Used
                        return client.relayPeerId !== undefined;
                    });
                    h.on('getDataSrv', 'user_list', () => {
                        return user_list;
                    });
                    h.on('getDataSrv', 'history', () => {
                        return history;
                    });
                    h.on('callbackSrv', 'response', (args) => {
                        const [res] = args;
                        resolve(res);
                    });

                    h.on('nameOfServiceWhereToSendXorError', 'errorProbably', (args) => {
                        // assuming error is the single argument
                        const [err] = args;
                        reject(err);
                    });
                })
                .handleTimeout(() => {
                    reject('message for timeout');
                })
                .build();
        },
    );
    await client.initiateFlow(request);
    return promise;
}
