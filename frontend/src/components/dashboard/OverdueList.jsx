import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, User, Calendar, CheckCircle } from 'lucide-react'; // Add CheckCircle here
import { format } from 'date-fns';

const OverdueList = ({ assignments }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Overdue Assignments</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {assignments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
            <p>No overdue assignments</p>
          </div>
        ) : (
          assignments.map((assignment) => (
            <Link
              key={assignment.id}
              to={`/assignments/${assignment.id}`}
              className="block p-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    <p className="text-sm font-medium text-gray-900">
                      {assignment.asset?.name || 'Unknown Asset'}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    {assignment.asset?.asset_code || 'N/A'}
                  </p>
                  <div className="mt-2 ml-6 space-y-1">
                    <div className="flex items-center text-xs text-gray-600">
                      <User className="h-3 w-3 mr-1" />
                      {assignment.assigned_to?.name || 'Unknown User'}
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      Expected: {assignment.expected_return_date ? 
                        format(new Date(assignment.expected_return_date), 'MMM d, yyyy') : 
                        'Not set'}
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex items-center px-2 py-1 bg-red-100 rounded-full">
                  <span className="text-xs font-medium text-red-600">
                    {assignment.days_overdue || 0} days overdue
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default OverdueList;