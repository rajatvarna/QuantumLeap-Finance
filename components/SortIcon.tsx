
import React from 'react';

interface SortIconProps {
  direction: 'asc' | 'desc' | null;
  isActive: boolean;
}

const SortIcon: React.FC<SortIconProps> = ({ direction, isActive }) => {
  return (
    <span className="inline-flex flex-col w-3 h-3 ml-1.5 text-text-tertiary self-center">
      {/* Up arrow */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-2 w-2 -mb-0.5 transition-colors ${isActive && direction === 'asc' ? 'text-text-primary' : 'hover:text-text-secondary'}`}
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path fillRule="evenodd" d="M7.247 4.86l-4.796 5.481c-.566.647-.106 1.659.753 1.659h9.592a1 1 0 0 0 .753-1.659l-4.796-5.48a1 1 0 0 0-1.506 0z"/>
      </svg>
      {/* Down arrow */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-2 w-2 transition-colors ${isActive && direction === 'desc' ? 'text-text-primary' : 'hover:text-text-secondary'}`}
        fill="currentColor"
        viewBox="0 0 16 16"
      >
         <path fillRule="evenodd" d="M7.247 11.14l-4.796-5.481c-.566-.647-.106-1.659.753-1.659h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z"/>
      </svg>
    </span>
  );
};

export default SortIcon;
