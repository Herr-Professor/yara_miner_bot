import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { TelegramProvider } from './context/TelegramContext';

ReactDOM.render(
    <TelegramProvider>
        <App />
    </TelegramProvider>,
    document.getElementById('root')
);
