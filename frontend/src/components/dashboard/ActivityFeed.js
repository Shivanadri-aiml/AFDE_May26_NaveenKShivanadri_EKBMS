import React from 'react';
import { FiFileText, FiCheck, FiX, FiUser, FiEdit, FiArchive } from 'react-icons/fi';
import { timeAgo } from '../../utils/helpers';

const activityIcons = {
  created: { icon: FiFileText, color: 'bg-blue-100 text-blue-600' },
  approved: { icon: FiCheck, color: 'bg-green-100 text-green-600' },
  rejected: { icon: FiX, color: 'bg-red-100 text-red-600' },
  submitted: { icon: FiEdit, color: 'bg-yellow-100 text-yellow-600' },
  archived: { icon: FiArchive, color: 'bg-gray-100 text-gray-600' },
  registered: { icon: FiUser, color: 'bg-purple-100 text-purple-600' },
  default: { icon: FiFileText, color: 'bg-gray-100 text-gray-600' }
};

const ActivityFeed = ({ activities = [] }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <FiFileText size={20} className="text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, index) => {
          const activityType = activity.type || 'default';
          const config = activityIcons[activityType] || activityIcons.default;
          const Icon = config.icon;
          const isLast = index === activities.length - 1;

          return (
            <li key={activity.id || index}>
              <div className="relative pb-6">
                {!isLast && (
                  <span
                    className="absolute left-4 top-8 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800">
                      <span className="font-medium">{activity.user || 'Unknown User'}</span>
                      {' '}
                      <span className="text-gray-600">{activity.description || activity.action}</span>
                      {activity.article && (
                        <>
                          {' '}
                          <span className="font-medium text-primary-600">
                            "{activity.article}"
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {activity.createdAt ? timeAgo(activity.createdAt) : activity.time || ''}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ActivityFeed;
