import config from 'src/app.json';
import { krasnodar } from '@fluencelabs/fluence-network-environment';

export const userList = {
    peer_id: config.services.user_list.node,
    service_id: config.services.user_list.id,
};

export const history = {
    peer_id: config.services.history.node,
    service_id: config.services.history.id,
};

export const fluentPadApp = {
    user_list: userList,
    history: history,
};

// export const relayNode = krasnodar[0];
export const relayNode = {
    multiaddr: '/ip4/127.0.0.1/tcp/4310/ws/p2p/12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
    peerId: '12D3KooWKEprYXUXqoV5xSBeyqrWLpQLLH4PXfvVkDJtmcqmh5V3',
};
