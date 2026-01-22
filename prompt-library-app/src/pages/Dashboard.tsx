import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePrompts } from '../hooks/usePrompts';
import type { PromptStatus } from '../types/prompt';

const Dashboard = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<PromptStatus[]>([]);

  const { prompts, loading, error } = usePrompts({
    search: search || undefined,
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
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold" style={{ color: 'var(--pl-text)' }}>Prompt Library</h2>
        <button
          onClick={() => navigate('/prompts/new')}
          className="px-4 py-2 rounded transition-colors font-medium"
          style={{ 
            backgroundColor: 'var(--pl-accent)', 
            color: 'white'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--pl-accent-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--pl-accent)'}
        >
          Create Prompt
        </button>
      </div>

      {/* Search and Filters */}
      <div 
        className="rounded p-6 mb-6"
        style={{ 
          backgroundColor: 'var(--pl-surface)', 
          border: '1px solid var(--pl-border)' 
        }}
      >
        <div className="mb-4">
          <label htmlFor="search" className="block text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>
            Search
          </label>
          <input
            id="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prompts..."
            className="w-full px-4 py-2 rounded transition-colors"
            style={{ 
              backgroundColor: 'var(--pl-bg)',
              border: '1px solid var(--pl-border)',
              color: 'var(--pl-text)'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--pl-accent)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--pl-border)'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>
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
                  className={`px-3 py-1 rounded text-sm transition-all ${
                    selectedStatus.includes(status)
                      ? getStatusColor(status)
                      : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400'
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
        <div className="rounded p-4 mb-6" style={{ 
          backgroundColor: '#7f1d1d', 
          border: '1px solid #991b1b',
          color: '#fca5a5'
        }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p style={{ color: 'var(--pl-text-muted)' }}>Loading prompts...</p>
        </div>
      ) : prompts.length === 0 ? (
        <div 
          className="text-center py-12 rounded"
          style={{ 
            backgroundColor: 'var(--pl-surface)', 
            border: '1px solid var(--pl-border)' 
          }}
        >
          <p style={{ color: 'var(--pl-text-muted)' }}>No prompts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map((prompt) => (
            <Link
              key={prompt.id}
              to={`/prompts/${prompt.id}`}
              className="rounded p-6 transition-all"
              style={{ 
                backgroundColor: 'var(--pl-surface)', 
                border: '1px solid var(--pl-border)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--pl-border-hover)';
                e.currentTarget.style.backgroundColor = 'var(--pl-surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--pl-border)';
                e.currentTarget.style.backgroundColor = 'var(--pl-surface)';
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold flex-1" style={{ color: 'var(--pl-text)' }}>
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
                <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--pl-text-muted)' }}>
                  {prompt.description}
                </p>
              )}

              <div className="mb-3">
                <span className="text-xs" style={{ color: 'var(--pl-text-muted)' }}>Purpose:</span>
                <p className="text-sm" style={{ color: 'var(--pl-text)' }}>{prompt.purpose}</p>
              </div>

              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {prompt.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs rounded bg-zinc-800 text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                  {prompt.tags.length > 3 && (
                    <span className="px-2 py-1 text-xs" style={{ color: 'var(--pl-text-muted)' }}>
                      +{prompt.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              <div className="text-xs" style={{ color: 'var(--pl-text-muted)' }}>
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
