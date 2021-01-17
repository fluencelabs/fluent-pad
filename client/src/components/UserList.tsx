import { useEffect, useState } from 'react';
import {
    fluentPadServiceId,
    notifyOnlineFnName,
    notifyUserAddedFnName,
    notifyUserRemovedFnName,
} from 'src/app/constants';
import { useFluenceClient } from '../app/FluenceClientContext';
import * as api from 'src/app/api';
import { PeerIdB58, subscribeToEvent } from '@fluencelabs/fluence';

interface User {
    id: PeerIdB58;
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

const refreshTimeoutMs = 2000;

export const UserList = (props: { selfName: string }) => {
    const client = useFluenceClient()!;
    const [users, setUsers] = useState<Map<PeerIdB58, User>>(new Map());

    useEffect(() => {
        const listRefreshTimer = setInterval(() => {
            setUsers((prev) => {
                const newUsers = Array.from(prev).map(
                    ([key, user]) => [key, turnUserAsOfflineCandidate(user)] as const,
                );
                return new Map(newUsers);
            });

            // don't block
            api.updateOnlineStatuses(client);
        }, refreshTimeoutMs);

        const unsub1 = subscribeToEvent(client, fluentPadServiceId, notifyUserAddedFnName, (args, _) => {
            const [users, setOnline] = args as [api.User[], boolean];
            setUsers((prev) => {
                const result = new Map(prev);
                for (let u of users) {
                    if (result.has(u.peer_id)) {
                        continue;
                    }

                    const isCurrentUser = u.peer_id === client.selfPeerId;

                    result.set(u.peer_id, {
                        name: u.name,
                        id: u.peer_id,
                        isOnline: isCurrentUser || setOnline,
                        shouldBecomeOnline: isCurrentUser || setOnline,
                    });
                }
                return result;
            });
        });

        const unsub2 = subscribeToEvent(client, fluentPadServiceId, notifyUserRemovedFnName, (args, _) => {
            const [userLeft] = args as [PeerIdB58];
            setUsers((prev) => {
                const result = new Map(prev);
                result.delete(userLeft);
                return result;
            });
        });

        const unsub3 = subscribeToEvent(client, fluentPadServiceId, notifyOnlineFnName, (args, _) => {
            const [userOnline] = args as [PeerIdB58[]];
            setUsers((prev) => {
                const result = new Map(prev);

                for (let u of userOnline) {
                    const toSetOnline = result.get(u);
                    if (toSetOnline) {
                        toSetOnline.shouldBecomeOnline = true;
                        toSetOnline.isOnline = true;
                    }
                }

                return result;
            });
        });

        // don't block
        api.getUserList(client);
        api.notifySelfAdded(client, props.selfName);

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

    return (
        <div className="userlist">
            <ul>
                {usersArray.map((x) => (
                    <li key={x.id}>
                        <span className={x.id === client.selfPeerId ? 'bold' : ''}>{x.name}</span>
                        <span className={x.isOnline ? 'green' : 'red'}> ({x.isOnline ? 'online' : 'offline'})</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
