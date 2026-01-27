import React from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Link } from 'react-router-dom';
import { Button, Badge } from '../ui';
import { useToast } from '../ui/Toast';
import { Skeleton } from '../ui/Skeleton';

interface VersionHistoryTabProps {
  promptId: Id<'prompts'>;
  currentVersionId?: Id<'prompt_versions'>;
  onCompareClick?: (v1: string, v2: string) => void;
}

export const VersionHistoryTab: React.FC<VersionHistoryTabProps> = ({
  promptId,
  currentVersionId,
  onCompareClick,
}) => {
  const versions = useQuery(api.versions.list, { promptId });
  const rollback = useMutation(api.versions.rollback);
  const { addToast } = useToast();

  const [selectedVersions, setSelectedVersions] = React.useState<string[]>([]);
  const [isRollingBack, setIsRollingBack] = React.useState(false);

  const handleVersionSelect = (versionNumber: string) => {
    if (selectedVersions.includes(versionNumber)) {
      setSelectedVersions(selectedVersions.filter((v) => v !== versionNumber));
    } else {
      if (selectedVersions.length < 2) {
        setSelectedVersions([...selectedVersions, versionNumber]);
      } else {
        setSelectedVersions([selectedVersions[1], versionNumber]);
      }
    }
  };

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      onCompareClick?.(selectedVersions[0], selectedVersions[1]);
    }
  };

  const handleRollback = async (versionId: Id<'prompt_versions'>) => {
    if (!confirm('Are you sure you want to rollback to this version?')) {
      return;
    }

    setIsRollingBack(true);

    try {
      await rollback({
        promptId,
        versionId,
      });

      addToast('success', 'Successfully rolled back to selected version');
    } catch (error) {
      console.error('Error rolling back:', error);
      addToast('error', 'Failed to rollback. Please try again.');
    } finally {
      setIsRollingBack(false);
    }
  };

  if (versions === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton width="100%" height="100px" />
        <Skeleton width="100%" height="100px" />
        <Skeleton width="100%" height="100px" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No versions found for this prompt.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedVersions.length === 2 && (
        <div className="flex items-center justify-between p-4 bg-[var(--pl-surface)] border border-[var(--pl-accent)]">
          <span className="text-sm text-gray-300">
            Selected: {selectedVersions[0]} and {selectedVersions[1]}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelectedVersions([])}>
              Clear
            </Button>
            <Button size="sm" onClick={handleCompare}>
              Compare Versions
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {versions.map((version) => {
          const isCurrent = version._id === currentVersionId;
          const isSelected = selectedVersions.includes(version.version_number);

          return (
            <div
              key={version._id}
              className={`p-4 bg-[var(--pl-surface)] border ${
                isSelected
                  ? 'border-[var(--pl-accent)]'
                  : 'border-[var(--pl-border)]'
              } hover:border-gray-600 transition-colors`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleVersionSelect(version.version_number)}
                    className="w-4 h-4 bg-[var(--pl-surface)] border-[var(--pl-border)] text-[var(--pl-accent)] focus:ring-[var(--pl-accent)]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-100">
                        v{version.version_number}
                      </h3>
                      {isCurrent && <Badge variant="active">Current</Badge>}
                    </div>
                    <p className="text-sm text-gray-400">
                      {version.change_description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isCurrent && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRollback(version._id)}
                      disabled={isRollingBack}
                    >
                      Rollback
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-4 text-gray-400">
                  <span>
                    Created: {new Date(version.created_at).toLocaleString()}
                  </span>
                  {version.author && <span>Author: {version.author}</span>}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Models:</span>
                  {version.models.map((model) => (
                    <Badge key={model} variant="default">
                      {model}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[var(--pl-border)]">
                <details>
                  <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                    View Content
                  </summary>
                  <pre className="mt-2 p-3 bg-black text-gray-300 text-xs overflow-x-auto whitespace-pre-wrap">
                    {version.content}
                  </pre>
                  {version.system_prompt && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-400 mb-1">System Prompt:</p>
                      <pre className="p-3 bg-black text-gray-300 text-xs overflow-x-auto whitespace-pre-wrap">
                        {version.system_prompt}
                      </pre>
                    </div>
                  )}
                </details>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
