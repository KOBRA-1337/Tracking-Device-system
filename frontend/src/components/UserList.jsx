import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './UserList.css';

const UserList = ({ selectedUser, onSelectUser, isAdmin }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      // In a real app, you'd have a /users endpoint
      // For now, we'll get users from locations
      const response = await api.get('/locations/all');
      const uniqueUsers = {};
      response.data.locations.forEach((loc) => {
        if (!uniqueUsers[loc.user_id]) {
          uniqueUsers[loc.user_id] = {
            id: loc.user_id,
            username: loc.username,
            full_name: loc.full_name,
            email: loc.email
          };
        }
      });
      setUsers(Object.values(uniqueUsers));
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return <div className="user-list-loading">Loading users...</div>;
  }

  return (
    <div className="user-list">
      <h3>Tracked Users</h3>
      {users.length === 0 ? (
        <p className="no-users">No users with location data</p>
      ) : (
        <ul className="user-list-items">
          {users.map((user) => (
            <li
              key={user.id}
              className={`user-item ${selectedUser === user.id ? 'selected' : ''}`}
              onClick={() => onSelectUser(user.id)}
            >
              <div className="user-name">{user.full_name || user.username}</div>
              <div className="user-email">{user.email}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserList;

