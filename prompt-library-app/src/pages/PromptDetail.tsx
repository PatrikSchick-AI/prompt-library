import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePrompt } from '../hooks/usePrompt';
import type { PromptStatus } from '../types/prompt';

const PromptDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { prompt, loading, error } = usePrompt(id);
  const [activeTab, setActiveTab] = useState<'content' | 'versions' | 'activity'>('content');

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Loading prompt...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-700">Prompt not found</p>
      </div>
    );
  }

  const getStatusColor = (status: PromptStatus) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      in_review: 'bg-yellow-100 text-yellow-700',
      testing: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      deprecated: 'bg-orange-100 text-orange-700',
      archived: 'bg-slate-100 text-slate-500',
    };
    return colors[status];
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Back to Dashboard
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {prompt.name}
            </h1>
            {prompt.description && (
              <p className="text-slate-600 mb-4">{prompt.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-slate-600">
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
            <button
              onClick={() => {
                /* TODO: Implement edit */
              }}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
            >
              Edit
            </button>
            <button
              onClick={() => {
                /* TODO: Implement new version */
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              New Version
            </button>
          </div>
        </div>

        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {prompt.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-4 border-b-2 transition-colors ${
              activeTab === 'content'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`pb-4 border-b-2 transition-colors ${
              activeTab === 'versions'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Versions
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`pb-4 border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
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
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Current Version: {prompt.current_version.version_number}
                  </h3>
                  <span className="text-sm text-slate-500">
                    {new Date(prompt.current_version.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">
                    Prompt Content
                  </h4>
                  <pre className="bg-slate-50 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                    {prompt.current_version.content}
                  </pre>
                </div>

                {prompt.current_version.system_prompt && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      System Prompt
                    </h4>
                    <pre className="bg-slate-50 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                      {prompt.current_version.system_prompt}
                    </pre>
                  </div>
                )}

                {prompt.current_version.models &&
                  prompt.current_version.models.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">
                        Compatible Models
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {prompt.current_version.models.map((model) => (
                          <span
                            key={model}
                            className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded"
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
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Version History
            </h3>
            <p className="text-slate-600">Version history coming soon...</p>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Activity Log
            </h3>
            <p className="text-slate-600">Activity log coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptDetail;
