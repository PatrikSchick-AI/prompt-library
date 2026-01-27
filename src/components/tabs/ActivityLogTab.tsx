import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Badge } from '../ui';
import { Skeleton } from '../ui/Skeleton';

interface ActivityLogTabProps {
  promptId: Id<'prompts'>;
}

const eventTypeLabels: Record<string, string> = {
  created: 'Created',
  version_created: 'Version Created',
  status_changed: 'Status Changed',
  metadata_updated: 'Metadata Updated',
  rollback: 'Rolled Back',
};

const eventTypeColors: Record<string, any> = {
  created: 'active',
  version_created: 'active',
  status_changed: 'in_review',
  metadata_updated: 'testing',
  rollback: 'deprecated',
};

export const ActivityLogTab: React.FC<ActivityLogTabProps> = ({ promptId }) => {
  const eventsData = useQuery(api.events.list, { promptId });

  if (eventsData === undefined) {
    return (
      <div className="space-y-3">
        <Skeleton width="100%" height="80px" />
        <Skeleton width="100%" height="80px" />
        <Skeleton width="100%" height="80px" />
      </div>
    );
  }

  if (!eventsData.events || eventsData.events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No activity found for this prompt.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {eventsData.events.map((event) => (
        <div
          key={event._id}
          className="p-4 bg-[var(--pl-surface)] border border-[var(--pl-border)]"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <Badge variant={eventTypeColors[event.event_type] || 'default'}>
                {eventTypeLabels[event.event_type] || event.event_type}
              </Badge>
              <span className="text-sm text-gray-400">
                {new Date(event.created_at).toLocaleString()}
              </span>
            </div>
            {event.created_by && (
              <span className="text-sm text-gray-500">by {event.created_by}</span>
            )}
          </div>

          {event.comment && (
            <p className="text-sm text-gray-300 mb-2">{event.comment}</p>
          )}

          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div className="mt-2 p-3 bg-black border border-[var(--pl-border)] text-xs">
              {event.event_type === 'status_changed' && (
                <div className="text-gray-400">
                  <span className="text-gray-500">Status: </span>
                  <span className="text-orange-400">{event.metadata.from}</span>
                  <span className="text-gray-500"> → </span>
                  <span className="text-green-400">{event.metadata.to}</span>
                </div>
              )}

              {event.event_type === 'version_created' && (
                <div className="space-y-1 text-gray-400">
                  <div>
                    <span className="text-gray-500">New Version: </span>
                    <span className="text-green-400">{event.metadata.version}</span>
                  </div>
                  {event.metadata.previous_version && (
                    <div>
                      <span className="text-gray-500">Previous: </span>
                      <span>{event.metadata.previous_version}</span>
                    </div>
                  )}
                  {event.metadata.type && (
                    <div>
                      <span className="text-gray-500">Type: </span>
                      <span className="capitalize">{event.metadata.type}</span>
                    </div>
                  )}
                </div>
              )}

              {event.event_type === 'rollback' && (
                <div className="text-gray-400">
                  <span className="text-gray-500">Rolled back: </span>
                  <span className="text-orange-400">{event.metadata.from_version}</span>
                  <span className="text-gray-500"> → </span>
                  <span className="text-green-400">{event.metadata.to_version}</span>
                </div>
              )}

              {event.event_type === 'metadata_updated' && event.metadata.fields && (
                <div className="text-gray-400">
                  <span className="text-gray-500">Updated fields: </span>
                  <span>{event.metadata.fields.join(', ')}</span>
                </div>
              )}

              {event.event_type === 'created' && (
                <div className="text-gray-400">
                  <span className="text-gray-500">Initial version: </span>
                  <span>{event.metadata.initial_version}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {eventsData.hasMore && (
        <div className="text-center py-4">
          <button className="text-sm text-[var(--pl-accent)] hover:text-indigo-400">
            Load More
          </button>
        </div>
      )}
    </div>
  );
};
