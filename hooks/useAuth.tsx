
import React, { createContext, useContext, useState, useMemo } from 'react';
import { User, SubscriptionPlan } from '../types';

interface AuthContextType {
    user: User | null;
    login: (plan: SubscriptionPlan) => void;
    logout: () => void;
    togglePlan: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const freeUser: User = { name: 'Guest', plan: SubscriptionPlan.FREE };
const proUser: User = { name: 'Pro User', plan: SubscriptionPlan.PRO };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(freeUser);

    const login = (plan: SubscriptionPlan) => {
        setUser(plan === SubscriptionPlan.PRO ? proUser : freeUser);
    };

    const logout = () => {
        setUser(null);
    };

    const togglePlan = () => {
        if (user?.plan === SubscriptionPlan.FREE) {
            setUser(proUser);
        } else {
            setUser(freeUser);
        }
    };

    const value = useMemo(() => ({ user, login, logout, togglePlan }), [user]);

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
