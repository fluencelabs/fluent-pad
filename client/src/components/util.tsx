import { toast } from 'react-toastify';

export const withErrorHandling = (fn: () => void): void => {
    try {
        fn();
    } catch (err) {
        console.error(err);
        toast.error('Something went wrong: ' + err);
    }
};

export const withErrorHandlingAsync = async (fn: () => Promise<void>): Promise<void> => {
    try {
        await fn();
    } catch (err) {
        console.error(err);
        toast.error('Something went wrong: ' + err);
    }
};
