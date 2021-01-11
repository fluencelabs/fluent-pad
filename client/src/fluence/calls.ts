import { fluenceClient } from '.';

export interface User {
    peer_id: String;
    relay_id: String;
    name: String;
}

export const joinRoom = async () => {
    let script = `
    (seq 
      (call myRelay ("op" "identity") [])
      (call userListNode ("" "join") []))`;

    const data = new Map();

    return await fluenceClient.fetch<User[]>(script, [], data);
};

export const leaveRoom = async () => {
    let script = `
  (seq 
    (call myRelay ("op" "identity") [])
    (call userListNode ("" "leave") []))`;

    const data = new Map();

    return await fluenceClient.fetch<void>(script, [], data);
};
