import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePrompt } from '../hooks/usePrompt';
import type { PromptStatus } from '../types/prompt';
import { Button, Badge, ConfirmDialog } from '../components/ui';
import { PromptDetailSkeleton } from '../components/ui/Skeleton';
import { EditPromptModal, NewVersionModal, StatusChangeModal } from '../components/modals';
import { VersionHistoryTab, ActivityLogTab } from '../components/tabs';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useToast } from '../components/ui/Toast';

const PromptDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { prompt, loading, error } = usePrompt(id);
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'content' | 'versions' | 'activity'>('content');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const deletePrompt = useMutation(api.prompts.deletePrompt);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!prompt) return;

    setIsDeleting(true);
    try {
      await deletePrompt({ id: prompt._id });
      addToast('success', 'Prompt deleted successfully');
      navigate('/');
    } catch (error) {
      console.error('Error deleting prompt:', error);
      addToast('error', 'Failed to delete prompt. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleCompareVersions = (v1: string, v2: string) => {
    if (prompt) {
      navigate(`/prompts/${prompt._id}/compare/${v1}/${v2}`);
    }
  };

  if (loading) {
    return <PromptDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded p-4" style={{ 
        backgroundColor: '#7f1d1d', 
        border: '1px solid #991b1b',
        color: '#fca5a5'
      }}>
        <p>{error}</p>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="rounded p-4" style={{ 
        backgroundColor: '#713f12', 
        border: '1px solid #854d0e',
        color: '#fbbf24'
      }}>
        <p>Prompt not found</p>
      </div>
    );
  }

  const getStatusColor = (status: PromptStatus) => {
    const colors = {
      draft: 'bg-zinc-800 text-zinc-300',
      in_review: 'bg-yellow-900/40 text-yellow-400',
      testing: 'bg-blue-900/40 text-blue-400',
      active: 'bg-green-900/40 text-green-400',
      deprecated: 'bg-orange-900/40 text-orange-400',
      archived: 'bg-zinc-800 text-zinc-500',
    };
    return colors[status];
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="mb-4 inline-block transition-colors"
          style={{ color: 'var(--pl-accent)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--pl-accent-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--pl-accent)'}
        >
          ← Back to Dashboard
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--pl-text)' }}>
              {prompt.name}
            </h1>
            {prompt.description && (
              <p className="mb-4" style={{ color: 'var(--pl-text-muted)' }}>{prompt.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--pl-text-muted)' }}>
              <span
                className={`px-3 py-1 rounded-full font-medium ${getStatusColor(
                  prompt.status
                )}`}
              >
                {prompt.status}
              </span>
              <span>Purpose: {prompt.purpose}</span>
              {prompt.owner && <span>Owner: {prompt.owner}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsStatusModalOpen(true)}
            >
              Change Status
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsNewVersionModalOpen(true)}
            >
              New Version
            </Button>
            <Button
              variant="danger"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          </div>
        </div>

        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {prompt.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-sm rounded bg-zinc-800 text-zinc-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6" style={{ borderBottom: '1px solid var(--pl-border)' }}>
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('content')}
            className="pb-4 transition-colors font-medium"
            style={{
              borderBottom: activeTab === 'content' ? '2px solid var(--pl-accent)' : '2px solid transparent',
              color: activeTab === 'content' ? 'var(--pl-accent)' : 'var(--pl-text-muted)'
            }}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className="pb-4 transition-colors font-medium"
            style={{
              borderBottom: activeTab === 'versions' ? '2px solid var(--pl-accent)' : '2px solid transparent',
              color: activeTab === 'versions' ? 'var(--pl-accent)' : 'var(--pl-text-muted)'
            }}
          >
            Versions
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className="pb-4 transition-colors font-medium"
            style={{
              borderBottom: activeTab === 'activity' ? '2px solid var(--pl-accent)' : '2px solid transparent',
              color: activeTab === 'activity' ? 'var(--pl-accent)' : 'var(--pl-text-muted)'
            }}
          >
            Activity
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          {prompt.current_version && (
            <>
              <div 
                className="rounded p-6"
                style={{ 
                  backgroundColor: 'var(--pl-surface)', 
                  border: '1px solid var(--pl-border)' 
                }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--pl-text)' }}>
                    Current Version: {prompt.current_version.version_number}
                  </h3>
                  <span className="text-sm" style={{ color: 'var(--pl-text-muted)' }}>
                    {new Date(prompt.current_version.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>
                    Prompt Content
                  </h4>
                  <pre 
                    className="p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap"
                    style={{ 
                      backgroundColor: 'var(--pl-bg)',
                      border: '1px solid var(--pl-border)',
                      color: 'var(--pl-text)'
                    }}
                  >
                    {prompt.current_version.content}
                  </pre>
                </div>

                {prompt.current_version.system_prompt && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>
                      System Prompt
                    </h4>
                    <pre 
                      className="p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap"
                      style={{ 
                        backgroundColor: 'var(--pl-bg)',
                        border: '1px solid var(--pl-border)',
                        color: 'var(--pl-text)'
                      }}
                    >
                      {prompt.current_version.system_prompt}
                    </pre>
                  </div>
                )}

                {prompt.current_version.models &&
                  prompt.current_version.models.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>
                        Compatible Models
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {prompt.current_version.models.map((model) => (
                          <span
                            key={model}
                            className="px-3 py-1 text-sm rounded bg-blue-900/40 text-blue-400"
                          >
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'versions' && (
        <VersionHistoryTab
          promptId={prompt._id}
          currentVersionId={prompt.current_version_id}
          onCompareClick={handleCompareVersions}
        />
      )}

      {activeTab === 'activity' && (
        <ActivityLogTab promptId={prompt._id} />
      )}

      {/* Modals */}
      {prompt && (
        <>
          <EditPromptModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            prompt={{
              _id: prompt._id,
              name: prompt.name,
              description: prompt.description,
              purpose: prompt.purpose,
              tags: prompt.tags,
            }}
          />

          {prompt.current_version && (
            <NewVersionModal
              isOpen={isNewVersionModalOpen}
              onClose={() => setIsNewVersionModalOpen(false)}
              promptId={prompt._id}
              currentVersion={prompt.current_version.version_number}
              currentContent={prompt.current_version.content}
              currentSystemPrompt={prompt.current_version.system_prompt}
              currentModels={prompt.current_version.models}
            />
          )}

          <StatusChangeModal
            isOpen={isStatusModalOpen}
            onClose={() => setIsStatusModalOpen(false)}
            promptId={prompt._id}
            currentStatus={prompt.status}
          />

          <ConfirmDialog
            isOpen={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={handleDelete}
            title="Delete Prompt"
            message="Are you sure you want to delete this prompt? This action cannot be undone."
            confirmText="Delete"
            variant="danger"
            isLoading={isDeleting}
          />
        </>
      )}
    </div>
  );
};

export default PromptDetail;
