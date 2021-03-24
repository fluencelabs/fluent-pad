import config from 'src/app.json';
import { testNet } from '@fluencelabs/fluence-network-environment';

export const fluentPadServiceId = 'fluence/fluent-pad';

export const notifyOnlineFnName = 'notifyOnline';
export const notifyUserAddedFnName = 'notifyUserAdded';
export const notifyUserRemovedFnName = 'notifyUserRemoved';
export const notifyTextUpdateFnName = 'notifyTextUpdate';

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

export const relayNode = testNet[0];
