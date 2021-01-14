import { FluenceClient } from '@fluencelabs/fluence';
import { createContext, useContext } from 'react';

export const FluenceClientContext = createContext<FluenceClient | null>(null);

export const useFluenceClient = () => {
    return useContext(FluenceClientContext);
};
