// import fluence, { Service, Function } from 'fluence';

import { useEffect, useState } from 'react';

abstract class FluenceService {
    abstract create();
    abstract destroy();
}

const registry: any = null;

const Service: any = (serviceId) => (constructor) => {
    constructor.serviceId = serviceId;

    constructor.create = () => {
        registry.registerService(serviceId, this);
    };

    constructor.destroy = () => {
        registry.deleteService(serviceId);
    };
};

const Function: any = (fnName) => (obj, fn) => {
    const s = registry.getService(obj.serviceId);
    s.registerFunction(fnName, fn);
};

@Service('calc_service')
export class CalcService {
    @Function('add')
    add(a: number, b: number) {
        return {
            result: a + b,
        };
    }

    @Function('mul')
    mul(a: number, b: number) {
        return {
            result: a * b,
        };
    }
}

const useFluenceService = <T extends FluenceService>() => {
    const [service, setService] = useState<T>();
    useEffect(() => {
        const service: T = undefined as any;
        setService(service);
        service.create();

        return () => {
            service.destroy();
        };
    });

    return service;
};
