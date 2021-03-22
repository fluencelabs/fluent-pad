import { FluenceClient, PeerIdB58 } from '@fluencelabs/fluence';
import { RequestFlowBuilder } from '@fluencelabs/fluence/dist/api.unstable';



export async function getUserList(client: FluenceClient, ): Promise<void> {
    let request;
    const promise = new Promise<string>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (call %init_peer_id% ("getDataSrv" "relay") [] relay)
 (call "userlist_node" ("userlist_id" "get_users") [] allUsers)
)

            `,
            )
            .configHandler((h) => {
                h.on('getDataSrv', 'relay', () => {
                    return client.relayPeerId;
                });
                h.on('getRelayService', 'hasReleay', () => {// Not Used
                    return client.relayPeerId !== undefined;
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
      


export async function join(client: FluenceClient, user: any, user_list: any): Promise<void> {
    let request;
    const promise = new Promise<string>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
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

            `,
            )
            .configHandler((h) => {
                h.on('getDataSrv', 'relay', () => {
                    return client.relayPeerId;
                });
                h.on('getRelayService', 'hasReleay', () => {// Not Used
                    return client.relayPeerId !== undefined;
                });
                h.on('getDataSrv', 'user', () => {return user;});
h.on('getDataSrv', 'user_list', () => {return user_list;});
                
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
      


export async function auth(client: FluenceClient, user_list: any): Promise<void> {
    let request;
    const promise = new Promise<string>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
(seq
 (seq
  (call %init_peer_id% ("getDataSrv" "user_list") [] user_list0)
  (call %init_peer_id% ("getDataSrv" "relay") [] relay)
 )
 (call user_list.$.peer_id (user_list.$.service_id "is_authenticated") [] res)
)

            `,
            )
            .configHandler((h) => {
                h.on('getDataSrv', 'relay', () => {
                    return client.relayPeerId;
                });
                h.on('getRelayService', 'hasReleay', () => {// Not Used
                    return client.relayPeerId !== undefined;
                });
                h.on('getDataSrv', 'user_list', () => {return user_list;});
                
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
      


export async function getHistory(client: FluenceClient, user_list: any, history: any): Promise<void> {
    let request;
    const promise = new Promise<string>((resolve, reject) => {
        request = new RequestFlowBuilder()
            .withRawScript(
                `
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
  (call history.$.peer_id (history.$.service_id "get_all") [] res11)
 )
)

            `,
            )
            .configHandler((h) => {
                h.on('getDataSrv', 'relay', () => {
                    return client.relayPeerId;
                });
                h.on('getRelayService', 'hasReleay', () => {// Not Used
                    return client.relayPeerId !== undefined;
                });
                h.on('getDataSrv', 'user_list', () => {return user_list;});
h.on('getDataSrv', 'history', () => {return history;});
                
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
      