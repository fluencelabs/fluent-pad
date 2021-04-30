import { useEffect, useState } from 'react';
import {
    fluentPadServiceId,
    notifyOnlineFnName,
    notifyUserAddedFnName,
    notifyUserRemovedFnName,
} from 'src/app/constants';
import { useFluenceClient } from '../app/FluenceClientContext';
import { PeerIdB58, subscribeToEvent } from '@fluencelabs/fluence';
import { withErrorHandlingAsync } from './util';
import { initAfterJoin, updateOnlineStatuses } from 'src/aqua/app';

interface User {
    id: PeerIdB58;
    name: string;
    isOnline: boolean;
}

interface ApiUser {
    name: string;
    peer_id: string;
    relay_id: string;
}

const refreshOnlineStatusTimeoutMs = 10000;

export const UserList = (props: { selfName: string }) => {
    const client = useFluenceClient()!;
    const [users, setUsers] = useState<Map<PeerIdB58, User>>(new Map());

    const updateOnlineStatus = (user, onlineStatus) => {
        setUsers((prev) => {
            const result = new Map(prev);
            const u = result.get(user);
            if (u) {
                result.set(user, { ...u, isOnline: onlineStatus });
            }
            return result;
        });
    };

    useEffect(() => {
        const listRefreshTimer = setInterval(() => {
            withErrorHandlingAsync(async () => {
                // await updateOnlineStatuses(client);
            });
        }, refreshOnlineStatusTimeoutMs);

        const unsub1 = subscribeToEvent(client, fluentPadServiceId, notifyUserAddedFnName, (args, _) => {
            const [user, isOnline] = args as [ApiUser, boolean];
            setUsers((prev) => {
                const u = user;
                const result = new Map(prev);
                if (result.has(u.peer_id)) {
                    return result;
                }

                result.set(u.peer_id, {
                    name: u.name,
                    id: u.peer_id,
                    isOnline: isOnline,
                });

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
            const [user, onlineStatus] = args as [PeerIdB58, boolean];
            updateOnlineStatus(user, onlineStatus);
        });

        // don't block
        withErrorHandlingAsync(async () => {
            await initAfterJoin(client, {
                name: props.selfName,
                peer_id: client.selfPeerId,
                relay_id: client.relayPeerId!,
            });
        });

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
