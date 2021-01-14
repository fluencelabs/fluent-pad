import { useEffect, useState } from 'react';
import {
    fluentPadServiceId,
    notifyOnlineFnName,
    notifyUserAddedFnName,
    notifyUserRemovedFnName,
} from 'src/fluence/constants';
import { subscribeToEvent } from 'src/fluence/exApi';
import { useFluenceClient } from './FluenceClientContext';
import * as calls from 'src/fluence/calls';

interface User {
    id: string;
    name: string;
    isOnline: boolean;
    shouldBecomeOnline: boolean;
}

const turnUserAsOfflineCandidate = (u: User): User => {
    return {
        ...u,
        isOnline: u.shouldBecomeOnline,
        shouldBecomeOnline: false,
    };
};

type PeerId = string;

const refreshTimeoutMs = 7000;

export const UserList = (props: { selfName: string }) => {
    const client = useFluenceClient()!;
    const [users, setUsers] = useState<Map<PeerId, User>>(new Map());

    useEffect(() => {
        const listRefreshTimer = setInterval(() => {
            setUsers((prev) => {
                const newUsers = Array.from(prev).map(
                    ([key, user]) => [key, turnUserAsOfflineCandidate(user)] as const,
                );
                return new Map(newUsers);
            });

            // don't block
            calls.updateOnlineStatuses(client);
        }, refreshTimeoutMs);

        const unsub1 = subscribeToEvent(client, fluentPadServiceId, notifyUserAddedFnName, (args, _) => {
            const users = args.flatMap((x) => x).flatMap((x) => x) as calls.User[];
            setUsers((prev) => {
                const result = new Map(prev);
                for (let u of users) {
                    if (result.has(u.peer_id)) {
                        continue;
                    }

                    const isCurrentUser = u.peer_id === client.selfPeerId.toB58String();

                    result.set(u.peer_id, {
                        name: u.name,
                        id: u.peer_id,
                        isOnline: isCurrentUser,
                        shouldBecomeOnline: isCurrentUser,
                    });
                }
                return result;
            });
        });

        const unsub2 = subscribeToEvent(client, fluentPadServiceId, notifyUserRemovedFnName, (args, _) => {
            const users = args.flatMap((x) => x) as PeerId[];
            setUsers((prev) => {
                const result = new Map(prev);
                for (let u of users) {
                    result.delete(u);
                }
                return result;
            });
        });

        const unsub3 = subscribeToEvent(client, fluentPadServiceId, notifyOnlineFnName, (args, _) => {
            const [[peerId], immediately] = args;
            setUsers((prev) => {
                const result = new Map(prev);

                const toSetOnline = result.get(peerId);
                if (toSetOnline) {
                    toSetOnline.shouldBecomeOnline = true;
                    if (immediately) {
                        toSetOnline.isOnline = true;
                    }
                }

                return result;
            });
        });

        // don't block
        calls.getUserList(client);
        calls.notifySelfAdded(client, props.selfName);

        return () => {
            clearTimeout(listRefreshTimer);
            unsub1();
            unsub2();
            unsub3();
        };
    }, []);

    const usersArray = Array.from(users)
        .map((x) => x[1])
        .sort((a, b) => a.name.localeCompare(b.name));

    const onlineUsers = usersArray.filter((x) => x.isOnline);
    const offlineUsers = usersArray.filter((x) => !x.isOnline);

    return (
        <div>
            <ul>
                {onlineUsers.map((x) => (
                    <li key={x.id}>
                        {x.name} ({x.id} <span style={{ color: 'green' }}>(online)</span>)
                    </li>
                ))}
                {offlineUsers.map((x) => (
                    <li key={x.id}>
                        {x.name} ({x.id} <span style={{ color: 'red' }}>(offline)</span>)
                    </li>
                ))}
            </ul>
        </div>
    );
};
