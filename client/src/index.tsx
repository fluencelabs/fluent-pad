import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './components/App';
import { setLogLevel } from '@fluencelabs/fluence';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

setLogLevel('trace');

ReactDOM.render(
    <React.StrictMode>
        <div>
            <App />
            <ToastContainer />
        </div>
    </React.StrictMode>,
    document.getElementById('root'),
);
