import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  User, 
  QrCode, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  ArrowRight 
} from 'lucide-react'; // Make sure all icons are imported

const ActivityFeed = ({ activities }) => {
  const getActivityIcon = (action) => {
    if (!action) return <Clock className="h-4 w-4 text-gray-500" />;
    if (action.includes('ASSET')) return <Package className="h-4 w-4 text-blue-500" />;
    if (action.includes('USER')) return <User className="h-4 w-4 text-green-500" />;
    if (action.includes('QR')) return <QrCode className="h-4 w-4 text-purple-500" />;
    if (action.includes('ERROR')) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (action.includes('SUCCESS')) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800';
      case 'INFO': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
      </div>
      
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {!activities || activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start space-x-3">
                <div className="shrink-0">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description || 'Unknown activity'}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(activity.severity)}`}>
                      {activity.severity || 'INFO'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <span className="truncate">by {activity.user || 'System'}</span>
                    <span className="mx-1">•</span>
                    <span>{activity.time_ago || 'Just now'}</span>
                  </div>
                  {activity.object_repr && (
                    <p className="mt-1 text-xs text-gray-600">
                      {activity.object_repr}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="px-6 py-3 bg-gray-50 rounded-b-lg">
        <Link
          to="/history/logs"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center"
        >
          View all activity
          <ArrowRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default ActivityFeed;