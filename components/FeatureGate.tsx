
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { SubscriptionPlan } from '../types';

interface FeatureGateProps {
    children: React.ReactNode;
    requiredPlan: SubscriptionPlan;
}

const planLevels: Record<SubscriptionPlan, number> = {
    [SubscriptionPlan.FREE]: 0,
    [SubscriptionPlan.PRO]: 1,
    [SubscriptionPlan.ENTERPRISE]: 2,
};

const FeatureGate: React.FC<FeatureGateProps> = ({ children, requiredPlan }) => {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    const userLevel = planLevels[user.plan];
    const requiredLevel = planLevels[requiredPlan];

    if (userLevel >= requiredLevel) {
        return <>{children}</>;
    }

    return (
        <div className="text-center p-8 bg-background/50 m-4 rounded-lg">
            <div className="flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-accent mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h4 className="text-lg font-semibold text-text-primary">Upgrade Required</h4>
                <p className="text-text-secondary mt-2">
                    This feature is available for <span className="font-bold text-accent">{requiredPlan}</span> plan subscribers.
                </p>
                <p className="text-sm text-text-tertiary mt-1">
                    Please upgrade your plan to access premium data.
                </p>
            </div>
        </div>
    );
};

export default FeatureGate;