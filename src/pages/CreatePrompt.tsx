import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { createPromptSchema } from '../lib/validators';
import { z } from 'zod';

interface FormErrors {
  name?: string;
  description?: string;
  purpose?: string;
  content?: string;
  system_prompt?: string;
  tags?: string;
  models?: string;
  author?: string;
  owner?: string;
  submit?: string;
}

const CreatePrompt = () => {
  const navigate = useNavigate();
  const createPrompt = useMutation(api.prompts.create);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    purpose: '',
    content: '',
    system_prompt: '',
    tags: '',
    models: '',
    author: '',
    owner: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Parse tags and models from comma-separated strings
      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const models = formData.models
        .split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0);

      // Build the data object
      const data = {
        name: formData.name,
        description: formData.description || undefined,
        purpose: formData.purpose,
        content: formData.content,
        system_prompt: formData.system_prompt || undefined,
        tags,
        models,
        author: formData.author || undefined,
        owner: formData.owner || undefined,
      };

      // Validate with Zod
      const validated = createPromptSchema.parse(data);

      // Create prompt
      const result = await createPrompt(validated);

      // Navigate to the new prompt
      navigate(`/prompts/${result.id}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Map Zod errors to form fields
        const fieldErrors: FormErrors = {};
        error.issues.forEach((err) => {
          const field = err.path[0] as string;
          fieldErrors[field as keyof FormErrors] = err.message;
        });
        setErrors(fieldErrors);
      } else if (error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: 'Failed to create prompt' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
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
        <h1 className="text-3xl font-bold" style={{ color: 'var(--pl-text)' }}>
          Create New Prompt
        </h1>
        <p className="mt-2" style={{ color: 'var(--pl-text-muted)' }}>
          Add a new prompt to the library
        </p>
      </div>

      {errors.submit && (
        <div className="rounded p-4 mb-6" style={{ 
          backgroundColor: '#7f1d1d', 
          border: '1px solid #991b1b',
          color: '#fca5a5'
        }}>
          <p>{errors.submit}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div 
          className="rounded p-6 space-y-6"
          style={{ 
            backgroundColor: 'var(--pl-surface)', 
            border: '1px solid var(--pl-border)' 
          }}
        >
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>
              Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 rounded transition-colors"
              style={{ 
                backgroundColor: 'var(--pl-bg)',
                border: `1px solid ${errors.name ? '#ef4444' : 'var(--pl-border)'}`,
                color: 'var(--pl-text)'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = errors.name ? '#ef4444' : 'var(--pl-accent)'}
              onBlur={(e) => e.currentTarget.style.borderColor = errors.name ? '#ef4444' : 'var(--pl-border)'}
              placeholder="e.g., Code Review Assistant"
              maxLength={255}
            />
            {errors.name && (
              <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 rounded transition-colors"
              style={{ 
                backgroundColor: 'var(--pl-bg)',
                border: `1px solid ${errors.description ? '#ef4444' : 'var(--pl-border)'}`,
                color: 'var(--pl-text)'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = errors.description ? '#ef4444' : 'var(--pl-accent)'}
              onBlur={(e) => e.currentTarget.style.borderColor = errors.description ? '#ef4444' : 'var(--pl-border)'}
              placeholder="Brief description of what this prompt does"
              maxLength={2000}
            />
            {errors.description && (
              <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.description}</p>
            )}
          </div>

          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>
              Purpose <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="purpose"
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-4 py-2 rounded transition-colors"
              style={{ 
                backgroundColor: 'var(--pl-bg)',
                border: `1px solid ${errors.purpose ? '#ef4444' : 'var(--pl-border)'}`,
                color: 'var(--pl-text)'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = errors.purpose ? '#ef4444' : 'var(--pl-accent)'}
              onBlur={(e) => e.currentTarget.style.borderColor = errors.purpose ? '#ef4444' : 'var(--pl-border)'}
              placeholder="e.g., code-review, content-generation, data-analysis"
              maxLength={500}
            />
            {errors.purpose && (
              <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.purpose}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>
              Prompt Content <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              className="w-full px-4 py-2 rounded transition-colors font-mono text-sm"
              style={{ 
                backgroundColor: 'var(--pl-bg)',
                border: `1px solid ${errors.content ? '#ef4444' : 'var(--pl-border)'}`,
                color: 'var(--pl-text)'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = errors.content ? '#ef4444' : 'var(--pl-accent)'}
              onBlur={(e) => e.currentTarget.style.borderColor = errors.content ? '#ef4444' : 'var(--pl-border)'}
              placeholder="The main prompt text that will be sent to the AI model..."
              maxLength={50000}
            />
            {errors.content && (
              <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.content}</p>
            )}
          </div>

          {/* System Prompt */}
          <div>
            <label htmlFor="system_prompt" className="block text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>
              System Prompt
            </label>
            <textarea
              id="system_prompt"
              value={formData.system_prompt}
              onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
              rows={5}
              className="w-full px-4 py-2 rounded transition-colors font-mono text-sm"
              style={{ 
                backgroundColor: 'var(--pl-bg)',
                border: `1px solid ${errors.system_prompt ? '#ef4444' : 'var(--pl-border)'}`,
                color: 'var(--pl-text)'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = errors.system_prompt ? '#ef4444' : 'var(--pl-accent)'}
              onBlur={(e) => e.currentTarget.style.borderColor = errors.system_prompt ? '#ef4444' : 'var(--pl-border)'}
              placeholder="Optional system-level instructions for the AI model..."
              maxLength={10000}
            />
            {errors.system_prompt && (
              <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.system_prompt}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>
              Tags
            </label>
            <input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-2 rounded transition-colors"
              style={{ 
                backgroundColor: 'var(--pl-bg)',
                border: `1px solid ${errors.tags ? '#ef4444' : 'var(--pl-border)'}`,
                color: 'var(--pl-text)'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = errors.tags ? '#ef4444' : 'var(--pl-accent)'}
              onBlur={(e) => e.currentTarget.style.borderColor = errors.tags ? '#ef4444' : 'var(--pl-border)'}
              placeholder="Comma-separated tags, e.g., coding, review, typescript"
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--pl-text-muted)' }}>
              Separate multiple tags with commas (max 20 tags)
            </p>
            {errors.tags && (
              <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.tags}</p>
            )}
          </div>

          {/* Models */}
          <div>
            <label htmlFor="models" className="block text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>
              Compatible Models
            </label>
            <input
              id="models"
              type="text"
              value={formData.models}
              onChange={(e) => setFormData({ ...formData, models: e.target.value })}
              className="w-full px-4 py-2 rounded transition-colors"
              style={{ 
                backgroundColor: 'var(--pl-bg)',
                border: `1px solid ${errors.models ? '#ef4444' : 'var(--pl-border)'}`,
                color: 'var(--pl-text)'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = errors.models ? '#ef4444' : 'var(--pl-accent)'}
              onBlur={(e) => e.currentTarget.style.borderColor = errors.models ? '#ef4444' : 'var(--pl-border)'}
              placeholder="e.g., gpt-4, claude-3, gemini-pro"
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--pl-text-muted)' }}>
              Separate multiple models with commas (max 20 models)
            </p>
            {errors.models && (
              <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.models}</p>
            )}
          </div>

          {/* Author */}
          <div>
            <label htmlFor="author" className="block text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>
              Author
            </label>
            <input
              id="author"
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="w-full px-4 py-2 rounded transition-colors"
              style={{ 
                backgroundColor: 'var(--pl-bg)',
                border: `1px solid ${errors.author ? '#ef4444' : 'var(--pl-border)'}`,
                color: 'var(--pl-text)'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = errors.author ? '#ef4444' : 'var(--pl-accent)'}
              onBlur={(e) => e.currentTarget.style.borderColor = errors.author ? '#ef4444' : 'var(--pl-border)'}
              placeholder="Your name or username"
              maxLength={255}
            />
            {errors.author && (
              <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.author}</p>
            )}
          </div>

          {/* Owner */}
          <div>
            <label htmlFor="owner" className="block text-sm font-medium mb-2" style={{ color: 'var(--pl-text)' }}>
              Owner
            </label>
            <input
              id="owner"
              type="text"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              className="w-full px-4 py-2 rounded transition-colors"
              style={{ 
                backgroundColor: 'var(--pl-bg)',
                border: `1px solid ${errors.owner ? '#ef4444' : 'var(--pl-border)'}`,
                color: 'var(--pl-text)'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = errors.owner ? '#ef4444' : 'var(--pl-accent)'}
              onBlur={(e) => e.currentTarget.style.borderColor = errors.owner ? '#ef4444' : 'var(--pl-border)'}
              placeholder="Team or organization name"
              maxLength={255}
            />
            {errors.owner && (
              <p className="mt-1 text-sm" style={{ color: '#ef4444' }}>{errors.owner}</p>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded transition-colors font-medium disabled:opacity-50"
              style={{ 
                backgroundColor: 'var(--pl-accent)', 
                color: 'white'
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--pl-accent-hover)')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = 'var(--pl-accent)')}
            >
              {loading ? 'Creating...' : 'Create Prompt'}
            </button>
            <Link
              to="/"
              className="px-6 py-2 rounded transition-colors font-medium"
              style={{ 
                backgroundColor: 'var(--pl-surface)', 
                border: '1px solid var(--pl-border)',
                color: 'var(--pl-text)',
                textDecoration: 'none',
                display: 'inline-block'
              }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePrompt;
