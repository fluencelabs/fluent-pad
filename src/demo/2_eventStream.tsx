// import fluence from 'fluence';

import { useEffect, useState } from 'react';

const fluence: any = {
    on: (channel: string, handler) => {
        // add subscription
    },

    registerEvent: (channel: string, eventName: string, validate?: (args: any[], tetraplets: any[][]) => boolean) => {
        const registry: any = null;
        const pushEvent: any = null;

        const s = registry.getService(channel);
        s.registerFunction(eventName, (args: any[], tetraplets: any[][]) => {
            if (validate && validate(args, tetraplets)) {
                // don't block
                setImmediate(() => {
                    pushEvent(channel, {
                        type: eventName,
                        args: args,
                    });
                });
                return {};
            }

            return {
                error: 'something',
            };
        });
    },
};

fluence.registerEvent('users', 'join', (args: any[], tetraplets) => {
    return args.length === 1 && args[0].is().guid() && args[1].is().string();
});

fluence.registerEvent('users', 'leave', (args: any[], tetraplets) => {
    return args.length === 1 && args[0].is().guid();
});

interface User {
    id: string; // guid,
    name: string;
}

export const DemoComponent = () => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        fluence.on('users', (msg) => {
            if (msg.type === 'join') {
                setUsers((prev) => [
                    ...prev,
                    {
                        id: msg.args[0],
                        name: msg.args[1],
                    },
                ]);
            }

            if (msg.type === 'leave') {
                setUsers((prev) => prev.filter((x) => x.id !== msg.args[0]));
            }
        });
    }, []);

    return (
        <div>
            <ul>
                {users.map((x) => (
                    <li key={x.id}>
                        <div>{x.id}</div>
                        <div>{x.name}</div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// RxJS

const Observable: any = null;

const users = Observable.create((observer) => {
    fluence.on('users', (msg) => {
        observer.next(msg);
    });
});

// ELM

const app: any = null;

fluence.on('users', (msg) => {
    app.ports.eventReceiver.send(msg.type, msg.args);
});

// Redux

const store: any = null;

fluence.on('users', (msg) => {
    store.dispatch(msg);
});
