import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './app/App';
import log from 'loglevel';

log.setLevel(2);

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root'),
);
