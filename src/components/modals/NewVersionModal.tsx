import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Modal, Button, Textarea, Select } from '../ui';
import { useToast } from '../ui/Toast';

interface NewVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptId: Id<'prompts'>;
  currentVersion: string;
  currentContent: string;
  currentSystemPrompt?: string;
  currentModels: string[];
  onSuccess?: () => void;
}

const versionTypeOptions = [
  { value: 'patch', label: 'Patch (bug fixes, minor changes)' },
  { value: 'minor', label: 'Minor (new features, backwards compatible)' },
  { value: 'major', label: 'Major (breaking changes)' },
];

export const NewVersionModal: React.FC<NewVersionModalProps> = ({
  isOpen,
  onClose,
  promptId,
  currentVersion,
  currentContent,
  currentSystemPrompt,
  currentModels,
  onSuccess,
}) => {
  const [versionType, setVersionType] = useState<'major' | 'minor' | 'patch'>('patch');
  const [changeDescription, setChangeDescription] = useState('');
  const [content, setContent] = useState(currentContent);
  const [systemPrompt, setSystemPrompt] = useState(currentSystemPrompt || '');
  const [modelsInput, setModelsInput] = useState(currentModels.join(', '));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createVersion = useMutation(api.versions.create);
  const { addToast } = useToast();

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!changeDescription.trim()) {
      newErrors.changeDescription = 'Change description is required';
    } else if (changeDescription.length < 10) {
      newErrors.changeDescription = 'Change description must be at least 10 characters';
    }

    if (!content.trim()) {
      newErrors.content = 'Prompt content is required';
    }

    const models = modelsInput
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    if (models.length === 0) {
      newErrors.models = 'At least one model is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const models = modelsInput
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      const result = await createVersion({
        promptId,
        versionType,
        changeDescription: changeDescription.trim(),
        content: content.trim(),
        system_prompt: systemPrompt.trim() || undefined,
        models,
      });

      addToast('success', `New version ${result.version} created successfully`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating version:', error);
      addToast('error', 'Failed to create version. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setVersionType('patch');
    setChangeDescription('');
    setContent(currentContent);
    setSystemPrompt(currentSystemPrompt || '');
    setModelsInput(currentModels.join(', '));
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Create New Version (current: ${currentVersion})`}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Create Version
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Version Type"
          value={versionType}
          onChange={(e) => setVersionType(e.target.value as 'major' | 'minor' | 'patch')}
          options={versionTypeOptions}
          required
        />

        <Textarea
          label="Change Description"
          value={changeDescription}
          onChange={(e) => setChangeDescription(e.target.value)}
          placeholder="Describe what changed in this version..."
          rows={3}
          error={errors.changeDescription}
          required
        />

        <Textarea
          label="Prompt Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter the prompt content..."
          rows={10}
          error={errors.content}
          required
        />

        <Textarea
          label="System Prompt (Optional)"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Optional system prompt..."
          rows={4}
        />

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Models
          </label>
          <input
            type="text"
            value={modelsInput}
            onChange={(e) => setModelsInput(e.target.value)}
            placeholder="e.g., gpt-4, claude-3-opus"
            className="w-full px-3 py-2 bg-[var(--pl-surface)] border border-[var(--pl-border)] text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--pl-accent)] focus:border-transparent"
          />
          {errors.models && (
            <p className="mt-1.5 text-sm text-red-400">{errors.models}</p>
          )}
          <p className="mt-1.5 text-sm text-gray-500">
            Separate multiple models with commas
          </p>
        </div>
      </form>
    </Modal>
  );
};
