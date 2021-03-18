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
import { withErrorHandlingAsync } from './util';

interface User {
    id: PeerIdB58;
    name: string;
    isOnline: boolean;
}

const refreshTimeoutMs = 2000;

export const UserList = (props: { selfName: string }) => {
    const client = useFluenceClient()!;
    const [users, setUsers] = useState<Map<PeerIdB58, User>>(new Map());

    useEffect(() => {
        const listRefreshTimer = setInterval(() => {
            // don't block
            withErrorHandlingAsync(async () => {
                await api.updateOnlineStatuses(client);
            });
        }, refreshTimeoutMs);

        const unsub1 = subscribeToEvent(client, fluentPadServiceId, notifyUserAddedFnName, (args, _) => {
            const [user, isOnline] = args as [api.User, boolean];
            console.log(user, isOnline);
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
            setUsers((prev) => {
                const result = new Map(prev);
                const u = result.get(user);
                if (u) {
                    result.set(user, { ...u, isOnline: onlineStatus });
                }
                return result;
            });
        });

        // don't block
        withErrorHandlingAsync(async () => {
            await api.getUserList(client);
            await api.notifySelfAdded(client, props.selfName);
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
