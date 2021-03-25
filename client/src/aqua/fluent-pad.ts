import { FluenceClient, PeerIdB58 } from '@fluencelabs/fluence';
import { RequestFlowBuilder } from '@fluencelabs/fluence/dist/api.unstable';

export async function join(
    client: FluenceClient,
    user: { name: string; peer_id: string; relay_id: string },
): Promise<{ err_msg: string; ret_code: number }> {
    let request;
    const promise = new Promise<{ err_msg: string; ret_code: number }>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (seq
  (seq
   (call %init_peer_id% ("getDataSrv" "user") [] user)
   (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  )
  (seq
   (seq
    (seq
     (call %init_peer_id% ("fluence/get-config" "getApp") [] app)
     (call %init_peer_id% ("fluence/get-config" "get_init_relay") [] relay4)
    )
    (call relay4 ("op" "identity") [])
   )
   (call app.$.user_list.peer_id! (app.$.user_list.service_id! "join") [user] res)
  )
 )
 (seq
  (call relay4 ("op" "identity") [])
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
            .handleScriptError(reject)
            .handleTimeout(() => {
                reject('Request timed out');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}

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
  (seq
   (seq
    (seq
     (call %init_peer_id% ("fluence/get-config" "getApp") [] app)
     (call %init_peer_id% ("fluence/get-config" "get_init_relay") [] relay2)
    )
    (call relay2 ("op" "identity") [])
   )
   (call app.$.user_list.peer_id! (app.$.user_list.service_id! "get_users") [] allUsers)
  )
 )
 (seq
  (call relay2 ("op" "identity") [])
  (call %init_peer_id% ("callbackSrv" "response") [allUsers.$.users!])
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
            .handleScriptError(reject)
            .handleTimeout(() => {
                reject('Request timed out');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}

export async function initAfterJoin(
    client: FluenceClient,
    me: { name: string; peer_id: string; relay_id: string },
): Promise<{ name: string; peer_id: string; relay_id: string }[]> {
    let request;
    const promise = new Promise<{ name: string; peer_id: string; relay_id: string }[]>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (seq
  (seq
   (call %init_peer_id% ("getDataSrv" "me") [] me)
   (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  )
  (seq
   (seq
    (seq
     (call %init_peer_id% ("fluence/get-config" "get_init_relay") [] relay3)
     (call %init_peer_id% ("fluence/get-config" "get_init_peer_id") [] init_peer_id)
    )
    (seq
     (seq
      (seq
       (call %init_peer_id% ("fluence/get-config" "getApp") [] app)
       (call %init_peer_id% ("fluence/get-config" "get_init_relay") [] relay8)
      )
      (call relay8 ("op" "identity") [])
     )
     (call app.$.user_list.peer_id! (app.$.user_list.service_id! "get_users") [] allUsers)
    )
   )
   (fold allUsers.$.users! user
    (seq
     (seq
      (seq
       (seq
        (seq
         (call user.$.relay_id! ("op" "identity") [])
         (call user.$.relay_id! ("peer" "is_connected") [user.$.peer_id!] isOnline)
        )
        (match isOnline true
         (call user.$.peer_id! ("fluence/fluent-pad" "notifyUserAdded") [me true])
        )
       )
       (call relay3 ("op" "identity") [])
      )
      (call init_peer_id ("fluence/fluent-pad" "notifyUserAdded") [user isOnline])
     )
     (next user)
    )
   )
  )
 )
 (seq
  (call relay3 ("op" "identity") [])
  (call %init_peer_id% ("callbackSrv" "response") [allUsers.$.users!])
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
                h.on('getDataSrv', 'me', () => {
                    return me;
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
            .handleScriptError(reject)
            .handleTimeout(() => {
                reject('Request timed out');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}

export async function updateOnlineStatuses(client: FluenceClient): Promise<boolean> {
    let request;
    const promise = new Promise<boolean>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (seq
  (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  (seq
   (seq
    (seq
     (call %init_peer_id% ("fluence/get-config" "get_init_relay") [] relay1)
     (call %init_peer_id% ("fluence/get-config" "get_init_peer_id") [] init_peer_id)
    )
    (seq
     (seq
      (seq
       (call %init_peer_id% ("fluence/get-config" "getApp") [] app)
       (call %init_peer_id% ("fluence/get-config" "get_init_relay") [] relay6)
      )
      (call relay6 ("op" "identity") [])
     )
     (call app.$.user_list.peer_id! (app.$.user_list.service_id! "get_users") [] allUsers)
    )
   )
   (fold allUsers.$.users! user
    (seq
     (seq
      (seq
       (seq
        (call user.$.relay_id! ("op" "identity") [])
        (call user.$.peer_id! ("peer" "is_connected") [user.$.peer_id!] isOnline)
       )
       (call relay1 ("op" "identity") [])
      )
      (call init_peer_id ("fluence/fluent-pad" "notifyOnline") [user.$.peer_id! isOnline])
     )
     (next user)
    )
   )
  )
 )
 (seq
  (call relay1 ("op" "identity") [])
  (call %init_peer_id% ("callbackSrv" "response") [true])
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
            .handleScriptError(reject)
            .handleTimeout(() => {
                reject('Request timed out');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}

export async function leave(client: FluenceClient, currentUserName: string): Promise<boolean> {
    let request;
    const promise = new Promise<boolean>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (seq
  (seq
   (call %init_peer_id% ("getDataSrv" "currentUserName") [] currentUserName)
   (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  )
  (seq
   (seq
    (seq
     (seq
      (seq
       (call %init_peer_id% ("fluence/get-config" "getApp") [] app)
       (call %init_peer_id% ("fluence/get-config" "get_init_relay") [] relay4)
      )
      (call relay4 ("op" "identity") [])
     )
     (call app.$.user_list.peer_id! (app.$.user_list.service_id! "leave") [currentUserName] res)
    )
    (seq
     (seq
      (seq
       (call %init_peer_id% ("fluence/get-config" "getApp") [] app15)
       (call %init_peer_id% ("fluence/get-config" "get_init_relay") [] relay16)
      )
      (call relay16 ("op" "identity") [])
     )
     (call app15.$.user_list.peer_id! (app15.$.user_list.service_id! "get_users") [] allUsers)
    )
   )
   (fold allUsers.$.users! user
    (seq
     (seq
      (call user.$.relay_id! ("op" "identity") [])
      (call user.$.peer_id! ("fluence/fluent-pad" "notifyUserRemoved") [currentUserName])
     )
     (next user)
    )
   )
  )
 )
 (seq
  (call relay4 ("op" "identity") [])
  (call %init_peer_id% ("callbackSrv" "response") [true])
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
                h.on('getDataSrv', 'currentUserName', () => {
                    return currentUserName;
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
            .handleScriptError(reject)
            .handleTimeout(() => {
                reject('Request timed out');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}

export async function auth(
    client: FluenceClient,
): Promise<{ err_msg: string; is_authenticated: boolean; ret_code: number }> {
    let request;
    const promise = new Promise<{ err_msg: string; is_authenticated: boolean; ret_code: number }>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (seq
  (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  (seq
   (seq
    (seq
     (call %init_peer_id% ("fluence/get-config" "getApp") [] app)
     (call %init_peer_id% ("fluence/get-config" "get_init_relay") [] relay2)
    )
    (call relay2 ("op" "identity") [])
   )
   (call app.$.user_list.peer_id! (app.$.user_list.service_id! "is_authenticated") [] res)
  )
 )
 (seq
  (call relay2 ("op" "identity") [])
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
            .handleScriptError(reject)
            .handleTimeout(() => {
                reject('Request timed out');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}

export async function getHistory(
    client: FluenceClient,
): Promise<{ entries: { body: string; id: number }[]; err_msg: string; ret_code: number }> {
    let request;
    const promise = new Promise<{ entries: { body: string; id: number }[]; err_msg: string; ret_code: number }>(
        (resolve, reject) => {
            request = new RequestFlowBuilder()
                .withRawScript(
                    `
(seq
 (seq
  (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  (seq
   (seq
    (call %init_peer_id% ("fluence/get-config" "getApp") [] app)
    (seq
     (seq
      (seq
       (call %init_peer_id% ("fluence/get-config" "getApp") [] app3)
       (call %init_peer_id% ("fluence/get-config" "get_init_relay") [] relay4)
      )
      (call relay4 ("op" "identity") [])
     )
     (call app3.$.user_list.peer_id! (app3.$.user_list.service_id! "is_authenticated") [] res)
    )
   )
   (call app.$.history.peer_id! (app.$.history.service_id! "get_all") [res.$.is_authenticated!] res17)
  )
 )
 (seq
  (call relay ("op" "identity") [])
  (call %init_peer_id% ("callbackSrv" "response") [res17])
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
                .handleScriptError(reject)
                .handleTimeout(() => {
                    reject('Request timed out');
                })
                .build();
        },
    );
    await client.initiateFlow(request);
    return promise;
}

export async function addEntry(
    client: FluenceClient,
    entry: string,
    selfPeerId: string,
): Promise<{ entry_id: number; err_msg: string; ret_code: number }> {
    let request;
    const promise = new Promise<{ entry_id: number; err_msg: string; ret_code: number }>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (seq
  (seq
   (seq
    (call %init_peer_id% ("getDataSrv" "entry") [] entry)
    (call %init_peer_id% ("getDataSrv" "selfPeerId") [] selfPeerId)
   )
   (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  )
  (seq
   (seq
    (seq
     (seq
      (call %init_peer_id% ("fluence/get-config" "getApp") [] app)
      (seq
       (seq
        (seq
         (call %init_peer_id% ("fluence/get-config" "getApp") [] app7)
         (call %init_peer_id% ("fluence/get-config" "get_init_relay") [] relay8)
        )
        (call relay8 ("op" "identity") [])
       )
       (call app7.$.user_list.peer_id! (app7.$.user_list.service_id! "is_authenticated") [] res)
      )
     )
     (call app.$.history.peer_id! (app.$.history.service_id! "add") [entry res.$.is_authenticated!] res21)
    )
    (seq
     (seq
      (seq
       (call %init_peer_id% ("fluence/get-config" "getApp") [] app25)
       (call %init_peer_id% ("fluence/get-config" "get_init_relay") [] relay26)
      )
      (call relay26 ("op" "identity") [])
     )
     (call app25.$.user_list.peer_id! (app25.$.user_list.service_id! "get_users") [] allUsers)
    )
   )
   (fold allUsers.$.users! user
    (seq
     (seq
      (call user.$.relay_id! ("op" "identity") [])
      (call user.$.peer_id! ("fluence/fluent-pad" "notifyTextUpdate") [entry selfPeerId res.$.is_authenticated!])
     )
     (next user)
    )
   )
  )
 )
 (seq
  (call relay ("op" "identity") [])
  (call %init_peer_id% ("callbackSrv" "response") [res21])
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
                h.on('getDataSrv', 'entry', () => {
                    return entry;
                });
                h.on('getDataSrv', 'selfPeerId', () => {
                    return selfPeerId;
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
            .handleScriptError(reject)
            .handleTimeout(() => {
                reject('Request timed out');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}
