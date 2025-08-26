
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { User, SubscriptionPlan } from '../types';

interface AuthContextType {
    user: User | null;
    login: (plan: SubscriptionPlan) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const users: Record<SubscriptionPlan, User> = {
    [SubscriptionPlan.FREE]: { name: 'Guest User', plan: SubscriptionPlan.FREE },
    [SubscriptionPlan.PRO]: { name: 'Pro User', plan: SubscriptionPlan.PRO },
    [SubscriptionPlan.ENTERPRISE]: { name: 'Enterprise User', plan: SubscriptionPlan.ENTERPRISE },
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // On initial load, check for a saved session
        try {
            const savedPlan = window.localStorage.getItem('userPlan') as SubscriptionPlan;
            if (savedPlan && users[savedPlan]) {
                setUser(users[savedPlan]);
            }
        } catch (error) {
            console.error("Could not access localStorage:", error);
        }
    }, []);

    const login = (plan: SubscriptionPlan) => {
        const userToLogin = users[plan];
        if (userToLogin) {
            setUser(userToLogin);
            try {
                window.localStorage.setItem('userPlan', plan);
            } catch (error) {
                console.error("Could not write to localStorage:", error);
            }
        }
    };

    const logout = () => {
        setUser(null);
        try {
            window.localStorage.removeItem('userPlan');
        } catch (error) {
            console.error("Could not remove from localStorage:", error);
        }
    };

    const value = useMemo(() => ({ user, login, logout }), [user]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
