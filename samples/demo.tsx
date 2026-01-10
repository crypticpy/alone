/**
 * Alone Theme - TypeScript/React Syntax Highlighting Demo
 * This file showcases various TypeScript and React language features
 * for theme preview purposes.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Type definitions
type Status = 'idle' | 'loading' | 'success' | 'error';

interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

interface UserCardProps {
  user: User;
  onSelect: (user: User) => void;
  className?: string;
}

/**
 * Fetches user data from the API
 * @param userId - The unique identifier of the user
 * @returns Promise resolving to User object
 */
async function fetchUser(userId: number): Promise<User> {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: User = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch user ${userId}:`, error);
    throw error;
  }
}

// React functional component with hooks
export const UserCard: React.FC<UserCardProps> = ({ user, onSelect, className }) => {
  const [status, setStatus] = useState<Status>('idle');
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log(`User ${user.name} card mounted`);
    }, 100);

    return () => clearTimeout(timer);
  }, [user.name]);

  // Memoized computed value
  const displayName = useMemo(() => {
    return user.name.length > 20 ? `${user.name.slice(0, 17)}...` : user.name;
  }, [user.name]);

  const handleClick = useCallback(() => {
    setClickCount((prev) => prev + 1);
    onSelect(user);
  }, [user, onSelect]);

  const statusBadge = status === 'loading' ? 'Processing...' : null;

  return (
    <div
      className={`user-card ${className ?? ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <h3>{displayName}</h3>
      <p>Email: {user.email}</p>
      {user.isActive && <span className="badge active">Active</span>}
      {statusBadge && <span className="status">{statusBadge}</span>}
      <small>Clicked {clickCount} times</small>
    </div>
  );
};

export default UserCard;
export type { User, UserCardProps };
