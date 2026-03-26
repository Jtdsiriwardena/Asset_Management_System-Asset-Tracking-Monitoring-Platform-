import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { assignmentAPI } from '../../api/assignments';
import {
  ArrowLeft,
  User,
  Calendar,
  Package,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  History,
  ThumbsUp,
  ThumbsDown,
  Flag
} from 'lucide-react';


const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showDamageModal, setShowDamageModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [returnNotes, setReturnNotes] = useState('');
  const [damageDescription, setDamageDescription] = useState('');
  const [approvalDecision, setApprovalDecision] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [condition, setCondition] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignment();
    fetchHistory();
  }, [id]);

  const fetchAssignment = async () => {
    setLoading(true);
    try {
      const response = await assignmentAPI.getAssignment(id);
      console.log('Assignment data:', response.data); // For debugging
      setAssignment(response.data);
    } catch (err) {
      console.error('Failed to fetch assignment details', err);
      setError('Failed to fetch assignment details. The assignment may not exist or you may not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await assignmentAPI.getHistory(id);
      setHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  const handleRequestReturn = async () => {
    setSubmitting(true);
    try {
      await assignmentAPI.requestReturn(id, { notes: returnNotes });
      await fetchAssignment();
      setShowReturnModal(false);
      setReturnNotes('');
    } catch (err) {
      alert('Failed to request return');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportDamage = async () => {
    if (!damageDescription.trim()) {
      alert('Please provide damage description');
      return;
    }

    setSubmitting(true);
    try {
      await assignmentAPI.reportDamage(id, { description: damageDescription });
      await fetchAssignment();
      setShowDamageModal(false);
      setDamageDescription('');
    } catch (err) {
      alert('Failed to report damage');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveReturn = async () => {
    setSubmitting(true);
    try {
      await assignmentAPI.approveReturn(id, {
        approve: approvalDecision,
        condition: condition,
        rejection_reason: rejectionReason
      });
      await fetchAssignment();
      setShowApproveModal(false);
      setCondition('');
      setRejectionReason('');
    } catch (err) {
      alert('Failed to process return request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteReturn = async () => {
    if (!window.confirm('Mark this asset as returned?')) return;

    setSubmitting(true);
    try {
      await assignmentAPI.completeReturn(id);
      await fetchAssignment();
    } catch (err) {
      alert('Failed to complete return');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'RETURN_REQUESTED': 'bg-yellow-100 text-yellow-800',
      'RETURN_APPROVED': 'bg-blue-100 text-blue-800',
      'RETURNED': 'bg-gray-100 text-gray-800',
      'OVERDUE': 'bg-red-100 text-red-800',
      'DAMAGED': 'bg-red-100 text-red-800',
      'REJECTED': 'bg-red-100 text-red-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canRequestReturn = () => {
    return assignment?.status === 'ACTIVE' &&
      assignment?.assigned_to === user?.id;
  };

  const canReportDamage = () => {
    return ['ACTIVE', 'RETURN_REQUESTED'].includes(assignment?.status) &&
      (assignment?.assigned_to === user?.id || isAdmin);
  };

  const canApproveReturn = () => {
    return assignment?.status === 'RETURN_REQUESTED' && isAdmin;
  };

  const canCompleteReturn = () => {
    return assignment?.status === 'RETURN_APPROVED' && isAdmin;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error || 'Assignment not found'}</p>
          <p className="text-sm text-gray-500 mt-2">The assignment may have been deleted or you may not have permission to view it.</p>
          <button
            onClick={() => navigate('/assignments')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-100">
   
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assignment Details</h1>
                <p className="text-sm text-gray-500">ID: {assignment.id}</p>
              </div>
            </div>

            <span className={`px-3 py-1 text-sm rounded-full ${getStatusBadge(assignment.status)}`}>
              {assignment.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                Asset Information
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Asset Name</p>
                  <p className="text-sm font-medium text-gray-900">
                    {assignment.asset_details?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Asset Code</p>
                  <p className="text-sm font-medium text-gray-900">
                    {assignment.asset_details?.asset_code}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Serial Number</p>
                  <p className="text-sm text-gray-900">
                    {assignment.asset_details?.serial_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="text-sm text-gray-900">
                    {assignment.asset_details?.category_name}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Link
                  to={`/assets/${assignment.asset}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View Asset Details →
                </Link>
              </div>
            </div>

            {/* Assignment Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Assignment Details</h2>

              <dl className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <dt className="text-sm text-gray-500 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Assigned To
                  </dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {assignment.assigned_to_details?.first_name} {assignment.assigned_to_details?.last_name}
                    <span className="text-gray-500 text-xs ml-2">
                      (@{assignment.assigned_to_details?.username})
                    </span>
                  </dd>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <dt className="text-sm text-gray-500 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Assigned By
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {assignment.assigned_by_name || 'System'}
                  </dd>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <dt className="text-sm text-gray-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Assigned Date
                  </dt>
                  <dd className="text-sm text-gray-900">{formatDate(assignment.assigned_date)}</dd>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <dt className="text-sm text-gray-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Expected Return
                  </dt>
                  <dd className={`text-sm ${assignment.is_overdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                    {formatDate(assignment.expected_return_date)}
                    {assignment.is_overdue && ' (Overdue)'}
                  </dd>
                </div>

                {assignment.actual_return_date && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-sm text-gray-500">Actual Return</dt>
                    <dd className="text-sm text-gray-900">{formatDate(assignment.actual_return_date)}</dd>
                  </div>
                )}

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <dt className="text-sm text-gray-500">Duration</dt>
                  <dd className="text-sm text-gray-900">{assignment.duration_days} days</dd>
                </div>

                {assignment.condition_before && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-sm text-gray-500">Condition (Before)</dt>
                    <dd className="text-sm text-gray-900">{assignment.condition_before}</dd>
                  </div>
                )}

                {assignment.condition_after && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-sm text-gray-500">Condition (After)</dt>
                    <dd className="text-sm text-gray-900">{assignment.condition_after}</dd>
                  </div>
                )}
              </dl>

              {assignment.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{assignment.notes}</p>
                </div>
              )}
            </div>

            {/* History Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <History className="w-5 h-5 mr-2 text-blue-600" />
                History Timeline
              </h2>

              <div className="flow-root">
                <ul className="-mb-8">
                  {history.map((event, index) => (
                    <li key={event.id}>
                      <div className="relative pb-8">
                        {index !== history.length - 1 && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
                              <Clock className="h-4 w-4 text-blue-600" />
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-gray-900">
                                {event.action.replace('_', ' ')}
                                {event.notes && (
                                  <span className="text-gray-500 ml-2">- {event.notes}</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                by {event.performed_by_name || 'System'}
                              </p>
                            </div>
                            <div className="whitespace-nowrap text-right text-xs text-gray-500">
                              {formatDate(event.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar - Actions */}
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>

              <div className="space-y-3">
                {canRequestReturn() && (
                  <button
                    onClick={() => setShowReturnModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Request Return
                  </button>
                )}

                {canReportDamage() && (
                  <button
                    onClick={() => setShowDamageModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Report Damage
                  </button>
                )}

                {canApproveReturn() && (
                  <button
                    onClick={() => setShowApproveModal(true)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Process Return Request
                  </button>
                )}

                {canCompleteReturn() && (
                  <button
                    onClick={handleCompleteReturn}
                    disabled={submitting}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Return
                  </button>
                )}
              </div>
            </div>

            {/* Damage/Return Info */}
            {assignment.damage_description && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Damage Report</h2>
                <p className="text-sm text-gray-700">{assignment.damage_description}</p>
              </div>
            )}

            {assignment.rejection_reason && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-2">Rejection Reason</h2>
                <p className="text-sm text-red-600">{assignment.rejection_reason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Return Request Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Request Return</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to request return for this asset?
            </p>

            <textarea
              placeholder="Add any notes about the return (optional)"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestReturn}
                disabled={submitting}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm Return Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Damage Report Modal */}
      {showDamageModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Report Damage</h3>

            <textarea
              placeholder="Describe the damage in detail..."
              value={damageDescription}
              onChange={(e) => setDamageDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              required
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDamageModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReportDamage}
                disabled={submitting || !damageDescription.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Report Damage'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject Return Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Process Return Request</h3>

            <div className="mb-4">
              <label className="flex items-center mb-2">
                <input
                  type="radio"
                  checked={approvalDecision}
                  onChange={() => setApprovalDecision(true)}
                  className="mr-2"
                />
                <span>Approve Return</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!approvalDecision}
                  onChange={() => setApprovalDecision(false)}
                  className="mr-2"
                />
                <span>Reject Return</span>
              </label>
            </div>

            {approvalDecision ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Condition After Use
                </label>
                <input
                  type="text"
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  placeholder="e.g., Good condition, minor wear"
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Rejection
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why the return is rejected..."
                  className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveReturn}
                disabled={submitting || (!approvalDecision && !rejectionReason.trim())}
                className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${approvalDecision ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
              >
                {submitting ? 'Processing...' : approvalDecision ? 'Approve Return' : 'Reject Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentDetail;