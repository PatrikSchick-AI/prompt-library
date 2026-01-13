import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePrompts } from '../hooks/usePrompts';
import type { PromptStatus } from '../types/prompt';

const Dashboard = () => {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<PromptStatus[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { prompts, loading, error } = usePrompts({
    search: search || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    status: selectedStatus.length > 0 ? selectedStatus : undefined,
  });

  const statusOptions: PromptStatus[] = [
    'draft',
    'in_review',
    'testing',
    'active',
    'deprecated',
    'archived',
  ];

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
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Prompt Library</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Prompt
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <div className="mb-4">
          <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-2">
            Search
          </label>
          <input
            id="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setSelectedStatus((prev) =>
                      prev.includes(status)
                        ? prev.filter((s) => s !== status)
                        : [...prev, status]
                    );
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedStatus.includes(status)
                      ? getStatusColor(status)
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Loading prompts...</p>
        </div>
      ) : prompts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <p className="text-slate-600">No prompts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((prompt) => (
            <Link
              key={prompt.id}
              to={`/prompts/${prompt.id}`}
              className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-slate-900 flex-1">
                  {prompt.name}
                </h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                    prompt.status
                  )}`}
                >
                  {prompt.status}
                </span>
              </div>

              {prompt.description && (
                <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                  {prompt.description}
                </p>
              )}

              <div className="mb-3">
                <span className="text-xs text-slate-500">Purpose:</span>
                <p className="text-sm text-slate-700">{prompt.purpose}</p>
              </div>

              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {prompt.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {prompt.tags.length > 3 && (
                    <span className="px-2 py-1 text-slate-500 text-xs">
                      +{prompt.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="text-xs text-slate-500">
                Updated {new Date(prompt.updated_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
