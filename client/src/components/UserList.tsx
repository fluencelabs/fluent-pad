import { useEffect, useState } from 'react';
import {
    fluentPadServiceId,
    notifyOnlineFnName,
    notifyUserAddedFnName,
    notifyUserRemovedFnName,
} from 'src/app/constants';
import { useFluenceClient } from '../app/FluenceClientContext';
import * as api from 'src/app/api';
import { subscribeToEvent } from '@fluencelabs/fluence';

type PeerId = string;

interface User {
    id: PeerId;
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
            api.updateOnlineStatuses(client);
        }, refreshTimeoutMs);

        const unsub1 = subscribeToEvent(client, fluentPadServiceId, notifyUserAddedFnName, (args, _) => {
            const users = args.flatMap((x) => x).flatMap((x) => x) as api.User[];
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
                        <span className={x.id === client.selfPeerId.toB58String() ? 'bold' : ''}>{x.name}</span>
                        <span className={x.isOnline ? 'green' : 'red'}> ({x.isOnline ? 'online' : 'offline'})</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
