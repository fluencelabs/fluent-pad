import { FluenceClient, PeerIdB58 } from '@fluencelabs/fluence';
import { RequestFlowBuilder } from '@fluencelabs/fluence/dist/api.unstable';

export async function join(
    client: FluenceClient,
    app: { history: { peer_id: string; service_id: string }; user_list: { peer_id: string; service_id: string } },
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
   (seq
    (call %init_peer_id% ("getDataSrv" "app") [] app0)
    (call %init_peer_id% ("getDataSrv" "user") [] user1)
   )
   (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  )
  (call app.$.user_list.peer_id! (app.$.user_list.service_id! "join") [user1] res)
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
                h.on('getDataSrv', 'app', () => {
                    return app;
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
                reject('message for timeout');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}

export async function getUserList(
    client: FluenceClient,
    app: { history: { peer_id: string; service_id: string }; user_list: { peer_id: string; service_id: string } },
): Promise<{ name: string; peer_id: string; relay_id: string }[]> {
    let request;
    const promise = new Promise<{ name: string; peer_id: string; relay_id: string }[]>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (seq
  (seq
   (call %init_peer_id% ("getDataSrv" "app") [] app0)
   (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  )
  (call app.$.user_list.peer_id! (app.$.user_list.service_id! "get_users") [] allUsers)
 )
 (seq
  (call relay ("op" "identity") [])
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
                h.on('getDataSrv', 'app', () => {
                    return app;
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
                reject('message for timeout');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}

export async function initAfterJoin(
    client: FluenceClient,
    app: { history: { peer_id: string; service_id: string }; user_list: { peer_id: string; service_id: string } },
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
   (seq
    (call %init_peer_id% ("getDataSrv" "app") [] app0)
    (call %init_peer_id% ("getDataSrv" "me") [] me1)
   )
   (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  )
  (seq
   (call app.$.user_list.peer_id! (app.$.user_list.service_id! "get_users") [] allUsers)
   (fold allUsers.$.users! user
    (par
     (par
      (call user.$.relay_id! ("op" "identity") [])
      (call user.$.peer_id! ("fluence/fluent-pad" "notifyUserAdded") [me1 true])
     )
     (next user)
    )
   )
  )
 )
 (seq
  (call relay ("op" "identity") [])
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
                h.on('getDataSrv', 'app', () => {
                    return app;
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
                reject('message for timeout');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}

export async function updateOnlineStatuses(
    client: FluenceClient,
    app: { history: { peer_id: string; service_id: string }; user_list: { peer_id: string; service_id: string } },
    updateStatus: (arg0: string, arg1: boolean) => void,
): Promise<void> {
    let request;
    const promise = new Promise<void>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (seq
  (call %init_peer_id% ("getDataSrv" "app") [] app0)
  (call %init_peer_id% ("getDataSrv" "relay") [] relay)
 )
 (seq
  (call app.$.user_list.peer_id! (app.$.user_list.service_id! "get_users") [] allUsers)
  (fold allUsers.$.users! user
   (par
    (par
     (call user.$.relay_id! ("op" "identity") [])
     (seq
      (call user.$.peer_id! ("peer" "is_connected") [user.$.peer_id!] isOnline)
      (call %init_peer_id% (callbackSrv "updateStatus") [user.$.peer_id! isOnline])
     )
    )
    (next user)
   )
  )
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
                h.on('getDataSrv', 'app', () => {
                    return app;
                });
                h.on('callbackSrv', 'updateStatus', (args) => {
                    return updateStatus(args[0], args[1]);
                });

                h.on('nameOfServiceWhereToSendXorError', 'errorProbably', (args) => {
                    // assuming error is the single argument
                    const [err] = args;
                    reject(err);
                });
            })
            .handleScriptError(reject)
            .handleTimeout(() => {
                reject('message for timeout');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}

export async function leave(
    client: FluenceClient,
    app: { history: { peer_id: string; service_id: string }; user_list: { peer_id: string; service_id: string } },
    currentUserName: string,
): Promise<void> {
    let request;
    const promise = new Promise<void>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (seq
  (seq
   (call %init_peer_id% ("getDataSrv" "app") [] app0)
   (call %init_peer_id% ("getDataSrv" "currentUserName") [] currentUserName1)
  )
  (call %init_peer_id% ("getDataSrv" "relay") [] relay)
 )
 (seq
  (seq
   (call app.$.user_list.peer_id! (app.$.user_list.service_id! "leave") [currentUserName1] res)
   (call app.$.user_list.peer_id! (app.$.user_list.service_id! "get_users") [] allUsers)
  )
  (fold allUsers.$.users! user
   (par
    (par
     (call user.$.relay_id! ("op" "identity") [])
     (call user.$.peer_id! ("fluence/fluent-pad" "notifyUserRemoved") [currentUserName1])
    )
    (next user)
   )
  )
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
                h.on('getDataSrv', 'app', () => {
                    return app;
                });
                h.on('getDataSrv', 'currentUserName', () => {
                    return currentUserName;
                });

                h.on('nameOfServiceWhereToSendXorError', 'errorProbably', (args) => {
                    // assuming error is the single argument
                    const [err] = args;
                    reject(err);
                });
            })
            .handleScriptError(reject)
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
    app: { history: { peer_id: string; service_id: string }; user_list: { peer_id: string; service_id: string } },
): Promise<{ err_msg: string; is_authenticated: boolean; ret_code: number }> {
    let request;
    const promise = new Promise<{ err_msg: string; is_authenticated: boolean; ret_code: number }>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (seq
  (seq
   (call %init_peer_id% ("getDataSrv" "app") [] app0)
   (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  )
  (call app.$.user_list.peer_id! (app.$.user_list.service_id! "is_authenticated") [] res)
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
                h.on('getDataSrv', 'app', () => {
                    return app;
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
                reject('message for timeout');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}

export async function getHistory(
    client: FluenceClient,
    app: { history: { peer_id: string; service_id: string }; user_list: { peer_id: string; service_id: string } },
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
   (call %init_peer_id% ("getDataSrv" "app") [] app0)
   (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  )
  (seq
   (call app.$.user_list.peer_id! (app.$.user_list.service_id! "is_authenticated") [] res)
   (call app.$.history.peer_id! (app.$.history.service_id! "get_all") [res.$.is_authenticated!] res9)
  )
 )
 (seq
  (call relay ("op" "identity") [])
  (call %init_peer_id% ("callbackSrv" "response") [res9])
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
                    h.on('getDataSrv', 'app', () => {
                        return app;
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
                    reject('message for timeout');
                })
                .build();
        },
    );
    await client.initiateFlow(request);
    return promise;
}

export async function addEntry(
    client: FluenceClient,
    app: { history: { peer_id: string; service_id: string }; user_list: { peer_id: string; service_id: string } },
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
    (seq
     (call %init_peer_id% ("getDataSrv" "app") [] app0)
     (call %init_peer_id% ("getDataSrv" "entry") [] entry1)
    )
    (call %init_peer_id% ("getDataSrv" "selfPeerId") [] selfPeerId3)
   )
   (call %init_peer_id% ("getDataSrv" "relay") [] relay)
  )
  (seq
   (seq
    (seq
     (call app.$.user_list.peer_id! (app.$.user_list.service_id! "is_authenticated") [] res)
     (call app.$.history.peer_id! (app.$.history.service_id! "add") [entry1 res.$.is_authenticated!] res13)
    )
    (call app.$.user_list.peer_id! (app.$.user_list.service_id! "get_users") [] allUsers)
   )
   (fold allUsers.$.users! user
    (par
     (par
      (call user.$.relay_id! ("op" "identity") [])
      (call user.$.peer_id! ("fluence/fluent-pad" "notifyTextUpdate") [entry1 selfPeerId3 res.$.is_authenticated!])
     )
     (next user)
    )
   )
  )
 )
 (seq
  (call relay ("op" "identity") [])
  (call %init_peer_id% ("callbackSrv" "response") [res13])
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
                h.on('getDataSrv', 'app', () => {
                    return app;
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
                reject('message for timeout');
            })
            .build();
    });
    await client.initiateFlow(request);
    return promise;
}
