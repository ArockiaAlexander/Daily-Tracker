import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Toast from './Toast';
import { Users, Plus, Trash2, Edit2, Search, Shield } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teams, setTeams] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch users and teams
  useEffect(() => {
    fetchUsers();
    fetchTeams();
  }, []);

  // Filter users based on search term
  useEffect(() => {
    const filtered = users.filter(user =>
      user.performer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, performer_name, role, team_id, client_id')
        .order('performer_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      showToast('Error loading users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  const handleUpdateRole = async (userId) => {
    if (!editingRole) {
      showToast('Select a role', 'error');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ role: editingRole })
        .eq('id', userId);

      if (error) throw error;
      showToast(`User role updated to ${editingRole}`, 'success');
      setSelectedUser(null);
      setEditingRole(null);
      fetchUsers();
    } catch (err) {
      console.error('Error updating role:', err);
      showToast('Error updating role', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeam = async (userId) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ team_id: editingTeam || null })
        .eq('id', userId);

      if (error) throw error;
      showToast('Team assignment updated', 'success');
      setSelectedUser(null);
      setEditingTeam(null);
      fetchUsers();
    } catch (err) {
      console.error('Error updating team:', err);
      showToast('Error updating team', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure? This will soft-delete the user.')) {
      return;
    }

    try {
      setLoading(true);
      // Soft delete by removing from organization
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'performer', team_id: null })
        .eq('id', userId);

      if (error) throw error;
      showToast('User removed from system', 'success');
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      showToast('Error removing user', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      'super_admin': 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
      'general_manager': 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
      'assistant_manager': 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
      'team_lead': 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
      'performer': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      'admin': 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
      'manager': 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
      'lead': 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
    };
    return colors[role] || colors['performer'];
  };

  const roleOptions = [
    { value: 'super_admin', label: '👑 Super Admin', description: 'Full system control' },
    { value: 'general_manager', label: '📊 General Manager', description: 'Organization overview' },
    { value: 'assistant_manager', label: '📈 Assistant Manager', description: 'Multi-team oversight' },
    { value: 'team_lead', label: '👥 Team Lead', description: 'Team management' },
    { value: 'performer', label: '👤 Performer', description: 'Individual contributor' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage roles, teams, and user permissions</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading && filteredUsers.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Current Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Team</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <React.Fragment key={user.id}>
                    <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {user.performer_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {teams.find(t => t.id === user.team_id)?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedUser(user.id === selectedUser ? null : user.id);
                            setEditingRole(user.role);
                            setEditingTeam(user.team_id);
                          }}
                          className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-900 transition"
                        >
                          {selectedUser === user.id ? 'Collapse' : 'Edit'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Details */}
                    {selectedUser === user.id && (
                      <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-700/30">
                        <td colSpan="4" className="px-4 py-4">
                          <div className="space-y-4">
                            {/* Role Selection */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Role
                              </label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {roleOptions.map(role => (
                                  <button
                                    key={role.value}
                                    onClick={() => setEditingRole(role.value)}
                                    className={`p-3 rounded-lg border-2 text-left transition ${
                                      editingRole === role.value
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                                    }`}
                                  >
                                    <p className="font-medium text-gray-900 dark:text-white">{role.label}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{role.description}</p>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Team Selection */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Assign to Team
                              </label>
                              <select
                                value={editingTeam || ''}
                                onChange={(e) => setEditingTeam(e.target.value || null)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                              >
                                <option value="">No Team (Unassigned)</option>
                                {teams.map(team => (
                                  <option key={team.id} value={team.id}>{team.name}</option>
                                ))}
                              </select>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateRole(user.id)}
                                disabled={loading || editingRole === user.role}
                                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                              >
                                {loading ? 'Updating...' : 'Update Role'}
                              </button>
                              <button
                                onClick={() => handleUpdateTeam(user.id)}
                                disabled={loading || editingTeam === user.team_id}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                              >
                                {loading ? 'Updating...' : 'Update Team'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Reference */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Role Reference</h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li><strong>Super Admin:</strong> Full system control, manage all users and workflows</li>
              <li><strong>General Manager:</strong> View all employees, access organization analytics</li>
              <li><strong>Assistant Manager:</strong> Manage multiple teams within their scope</li>
              <li><strong>Team Lead:</strong> Manage own team members, view team performance</li>
              <li><strong>Performer:</strong> Individual contributor, submit own entries</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
