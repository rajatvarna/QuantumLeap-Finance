import React from 'react';

// Fix: Allow style and other HTML attributes to be passed to the component.
interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className, ...props }) => {
    return (
        <div className={`bg-white/5 animate-pulse rounded-lg ${className}`} {...props}></div>
    );
};

export default SkeletonLoader;
