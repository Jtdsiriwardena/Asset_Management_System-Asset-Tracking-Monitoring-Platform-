import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react'; // Make sure all icons are imported
import { format } from 'date-fns';

const WarrantyList = ({ warranties }) => {
  const getStatusColor = (days) => {
    if (days <= 7) return 'text-red-600 bg-red-50';
    if (days <= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusIcon = (days) => {
    if (days <= 7) return <AlertCircle className="h-4 w-4 text-red-600" />;
    if (days <= 30) return <Calendar className="h-4 w-4 text-yellow-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Warranties Expiring Soon</h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {warranties.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
            <p>No warranties expiring soon</p>
          </div>
        ) : (
          warranties.map((warranty) => (
            <Link
              key={warranty.id}
              to={`/assets/${warranty.id}`}
              className="block p-4 hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{warranty.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{warranty.asset_code}</p>
                  <div className="flex items-center mt-2">
                    <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-600">
                      Expires: {warranty.warranty_expiry ? 
                        format(new Date(warranty.warranty_expiry), 'MMM d, yyyy') : 
                        'Not set'}
                    </span>
                  </div>
                </div>
                {warranty.days_remaining && (
                  <div className={`ml-4 flex items-center px-2 py-1 rounded-full ${getStatusColor(warranty.days_remaining)}`}>
                    {getStatusIcon(warranty.days_remaining)}
                    <span className="ml-1 text-xs font-medium">
                      {warranty.days_remaining} days
                    </span>
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default WarrantyList;