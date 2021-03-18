import app from 'src/app.json';
import { testNet } from '@fluencelabs/fluence-network-environment';

export const fluentPadServiceId = 'fluence/fluent-pad';

export const notifyOnlineFnName = 'notifyOnline';
export const notifyUserAddedFnName = 'notifyUserAdded';
export const notifyUserRemovedFnName = 'notifyUserRemoved';
export const notifyTextUpdateFnName = 'notifyTextUpdate';

export const userList = {
    node: app.services.user_list.node,
    id: app.services.user_list.id,
};

export const history = {
    node: app.services.history.node,
    id: app.services.history.id,
};

export const relayNode = testNet[0];
