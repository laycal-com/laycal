"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface User {
  _id: string;
  userId: string; // Clerk ID
  email?: string;
  name?: string;
  planType: string;
  creditBalance: number;
  isActive: boolean;
  createdAt: string;
  lastActivity?: string;
  totalSpent?: number;
  assistantsCreated?: number;
  callsToday?: number;
}

interface CreditAdjustment {
  userId: string;
  amount: number;
  reason: string;
}

interface UserActivation {
  userId: string;
  amount: number;
  description: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [creditAdjustment, setCreditAdjustment] = useState<CreditAdjustment>({
    userId: '',
    amount: 0,
    reason: ''
  });
  const [userActivation, setUserActivation] = useState<UserActivation>({
    userId: '',
    amount: 25,
    description: ''
  });
  const [adjusting, setAdjusting] = useState(false);
  const [activating, setActivating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 20;

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: usersPerPage.toString(),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalUsers(data.total);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreditAdjustment = async () => {
    if (!creditAdjustment.userId || !creditAdjustment.reason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (creditAdjustment.amount === 0) {
      toast.error('Amount cannot be zero');
      return;
    }

    setAdjusting(true);
    try {
      const response = await fetch('/api/admin/users/credits/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(creditAdjustment),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(
          `Successfully ${creditAdjustment.amount > 0 ? 'added' : 'removed'} $${Math.abs(creditAdjustment.amount)} ${creditAdjustment.amount > 0 ? 'to' : 'from'} user's account`
        );
        
        // Update the user in the list
        setUsers(users.map(user => 
          user.userId === creditAdjustment.userId 
            ? { ...user, creditBalance: data.newBalance }
            : user
        ));

        // Close modal and reset form
        setShowCreditModal(false);
        setCreditAdjustment({ userId: '', amount: 0, reason: '' });
        setSelectedUser(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to adjust credits');
      }
    } catch (error) {
      toast.error('Failed to adjust credits');
    } finally {
      setAdjusting(false);
    }
  };

  const openCreditModal = (user: User) => {
    setSelectedUser(user);
    setCreditAdjustment({
      userId: user.userId,
      amount: 0,
      reason: ''
    });
    setShowCreditModal(true);
  };

  const openActivateModal = (user: User) => {
    setSelectedUser(user);
    setUserActivation({
      userId: user.userId,
      amount: 25, // Default to $25
      description: `Initial activation for ${user.email || user.name || 'user'}`
    });
    setShowActivateModal(true);
  };

  const handleUserActivation = async () => {
    if (!userActivation.userId || !userActivation.description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (userActivation.amount <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }

    setActivating(true);
    try {
      const response = await fetch(`/api/admin/users/${userActivation.userId}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: userActivation.amount,
          description: userActivation.description
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        
        // Update the user in the list
        setUsers(users.map(user => 
          user.userId === userActivation.userId 
            ? { ...user, creditBalance: data.subscription.creditBalance, isActive: data.subscription.isActive }
            : user
        ));

        // Close modal and reset form
        setShowActivateModal(false);
        setUserActivation({ userId: '', amount: 25, description: '' });
        setSelectedUser(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to activate user account');
      }
    } catch (error) {
      toast.error('Failed to activate user account');
    } finally {
      setActivating(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalUsers / usersPerPage);

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">
          Manage user accounts, view balances, and adjust credits.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by email, name, or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          Showing {users.length} of {totalUsers} users
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Credit Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.name || 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">{user.email || user.userId}</div>
                      <div className="text-xs text-gray-400">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.planType === 'payg' ? 'bg-green-100 text-green-800' :
                        user.planType === 'starter' ? 'bg-blue-100 text-blue-800' :
                        user.planType === 'growth' ? 'bg-purple-100 text-purple-800' :
                        user.planType === 'pro' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.planType?.toUpperCase() || 'NONE'}
                      </span>
                      {!user.isActive && (
                        <div>
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            INACTIVE
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${user.creditBalance?.toFixed(2) || '0.00'}
                    </div>
                    {user.totalSpent && (
                      <div className="text-xs text-gray-500">
                        Total spent: ${user.totalSpent.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{user.assistantsCreated || 0} assistants</div>
                    <div>{user.callsToday || 0} calls today</div>
                    {user.lastActivity && (
                      <div className="text-xs">
                        Active {new Date(user.lastActivity).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!user.isActive ? (
                      <button
                        onClick={() => openActivateModal(user)}
                        className="text-green-600 hover:text-green-900 mr-3 font-medium"
                      >
                        Activate Account
                      </button>
                    ) : (
                      <button
                        onClick={() => openCreditModal(user)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Adjust Credits
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDetailsModal(true);
                      }}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + Math.max(1, currentPage - 2);
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Activation Modal */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Activate User Account</h3>
              <p className="text-sm text-gray-600 mt-1">
                User: {selectedUser?.email || selectedUser?.name || selectedUser?.userId}
              </p>
              <p className="text-sm text-gray-600">
                This will create a Pay-as-you-go subscription with initial credits
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Initial Credit Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={userActivation.amount}
                  onChange={(e) => setUserActivation({
                    ...userActivation,
                    amount: parseFloat(e.target.value) || 0
                  })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="25.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: $25 for initial PAYG activation
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={userActivation.description}
                  onChange={(e) => setUserActivation({
                    ...userActivation,
                    description: e.target.value
                  })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Reason for manual activation..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowActivateModal(false);
                  setUserActivation({ userId: '', amount: 25, description: '' });
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUserActivation}
                disabled={activating || !userActivation.description.trim() || userActivation.amount <= 0}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activating ? 'Activating...' : 'Activate Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">User Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="font-medium text-gray-700">Name:</label>
                <p className="text-gray-900">{selectedUser.name || 'Not provided'}</p>
              </div>
              
              <div>
                <label className="font-medium text-gray-700">Email:</label>
                <p className="text-gray-900">{selectedUser.email || 'Not provided'}</p>
              </div>
              
              <div>
                <label className="font-medium text-gray-700">User ID:</label>
                <p className="text-gray-900 font-mono text-xs break-all">{selectedUser.userId}</p>
              </div>
              
              <div>
                <label className="font-medium text-gray-700">Plan:</label>
                <p className="text-gray-900">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedUser.planType === 'payg' ? 'bg-green-100 text-green-800' :
                    selectedUser.planType === 'starter' ? 'bg-blue-100 text-blue-800' :
                    selectedUser.planType === 'growth' ? 'bg-purple-100 text-purple-800' :
                    selectedUser.planType === 'pro' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedUser.planType?.toUpperCase() || 'NONE'}
                  </span>
                  {!selectedUser.isActive && (
                    <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      INACTIVE
                    </span>
                  )}
                </p>
              </div>
              
              <div>
                <label className="font-medium text-gray-700">Credit Balance:</label>
                <p className="text-gray-900 font-medium">${selectedUser.creditBalance?.toFixed(2) || '0.00'}</p>
              </div>
              
              <div>
                <label className="font-medium text-gray-700">Assistants Created:</label>
                <p className="text-gray-900">{selectedUser.assistantsCreated || 0}</p>
              </div>
              
              <div>
                <label className="font-medium text-gray-700">Calls Today:</label>
                <p className="text-gray-900">{selectedUser.callsToday || 0}</p>
              </div>
              
              <div>
                <label className="font-medium text-gray-700">Total Spent:</label>
                <p className="text-gray-900">${selectedUser.totalSpent?.toFixed(2) || '0.00'}</p>
              </div>
              
              <div>
                <label className="font-medium text-gray-700">Joined:</label>
                <p className="text-gray-900">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div>
                <label className="font-medium text-gray-700">Last Activity:</label>
                <p className="text-gray-900">{selectedUser.lastActivity ? new Date(selectedUser.lastActivity).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Adjustment Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Adjust Credits</h3>
              <p className="text-sm text-gray-600 mt-1">
                User: {selectedUser?.email || selectedUser?.name || selectedUser?.userId}
              </p>
              <p className="text-sm text-gray-600">
                Current Balance: ${selectedUser?.creditBalance?.toFixed(2) || '0.00'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={creditAdjustment.amount}
                  onChange={(e) => setCreditAdjustment({
                    ...creditAdjustment,
                    amount: parseFloat(e.target.value) || 0
                  })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter positive to add, negative to remove"
                />
                <p className="text-xs text-gray-500 mt-1">
                  New balance will be: ${((selectedUser?.creditBalance || 0) + creditAdjustment.amount).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason
                </label>
                <textarea
                  value={creditAdjustment.reason}
                  onChange={(e) => setCreditAdjustment({
                    ...creditAdjustment,
                    reason: e.target.value
                  })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Explain why you're making this adjustment..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreditModal(false);
                  setCreditAdjustment({ userId: '', amount: 0, reason: '' });
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreditAdjustment}
                disabled={adjusting || !creditAdjustment.reason.trim() || creditAdjustment.amount === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adjusting ? 'Adjusting...' : 'Adjust Credits'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}