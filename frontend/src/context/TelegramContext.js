import React, { createContext, useState, useEffect } from 'react';

export const TelegramContext = createContext();

export const TelegramProvider = ({ children }) => {
    const [telegramUser, setTelegramUser] = useState(null);

    useEffect(() => {
        const tg = window.Telegram.WebApp;
        if (tg.initDataUnsafe.user) {
            setTelegramUser(tg.initDataUnsafe.user);
        }
        tg.expand();
    }, []);

    return (
        <TelegramContext.Provider value={{ telegramUser }}>
            {children}
        </TelegramContext.Provider>
    );
};