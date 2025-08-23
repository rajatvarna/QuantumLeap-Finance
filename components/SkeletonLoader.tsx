
import React from 'react';

interface SkeletonLoaderProps {
    className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className }) => {
    return (
        <div className={`bg-gray-700 animate-pulse rounded-md ${className}`}></div>
    );
};

export default SkeletonLoader;
