import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if token exists and decode user info
        if (token) {
            try {
                // Decode JWT token to get user info
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({
                    userId: payload.sub,
                    username: localStorage.getItem('username'),
                    rankedPoints: parseInt(localStorage.getItem('rankedPoints')) || 0
                });
            } catch (err) {
                console.error('Error decoding token:', err);
                logout();
            }
        }
        setLoading(false);
    }, [token]);

    const login = (userData, authToken) => {
        localStorage.setItem('token', authToken);
        localStorage.setItem('username', userData.username);
        localStorage.setItem('rankedPoints', userData.rankedPoints || 0);
        setToken(authToken);
        setUser({
            userId: userData.userId,
            username: userData.username,
            rankedPoints: userData.rankedPoints || 0
        });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('rankedPoints');
        setToken(null);
        setUser(null);
    };

    const updateUserStats = (stats) => {
        if (user) {
            const updatedUser = {
                ...user,
                rankedPoints: stats.rankedPoints !== undefined ? stats.rankedPoints : user.rankedPoints
            };
            setUser(updatedUser);
            localStorage.setItem('rankedPoints', updatedUser.rankedPoints || 0);
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            loading, 
            login, 
            logout, 
            updateUserStats 
        }}>
            {children}
        </AuthContext.Provider>
    );
};