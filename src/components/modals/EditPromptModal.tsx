import React, { useState, useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Modal, Button, Input, Textarea, Select } from '../ui';
import { useToast } from '../ui/Toast';

interface EditPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompt: {
    _id: Id<'prompts'>;
    name: string;
    description?: string;
    purpose: string;
    tags: string[];
  };
  onSuccess?: () => void;
}

const purposeOptions = [
  { value: 'code_generation', label: 'Code Generation' },
  { value: 'debugging', label: 'Debugging' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'testing', label: 'Testing' },
  { value: 'refactoring', label: 'Refactoring' },
  { value: 'review', label: 'Code Review' },
  { value: 'analysis', label: 'Analysis' },
  { value: 'explanation', label: 'Explanation' },
  { value: 'general', label: 'General' },
];

export const EditPromptModal: React.FC<EditPromptModalProps> = ({
  isOpen,
  onClose,
  prompt,
  onSuccess,
}) => {
  const [name, setName] = useState(prompt.name);
  const [description, setDescription] = useState(prompt.description || '');
  const [purpose, setPurpose] = useState(prompt.purpose);
  const [tagsInput, setTagsInput] = useState(prompt.tags.join(', '));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updatePrompt = useMutation(api.prompts.update);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setName(prompt.name);
      setDescription(prompt.description || '');
      setPurpose(prompt.purpose);
      setTagsInput(prompt.tags.join(', '));
      setErrors({});
    }
  }, [isOpen, prompt]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (!purpose) {
      newErrors.purpose = 'Purpose is required';
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
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
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await updatePrompt({
        id: prompt._id,
        name: name.trim(),
        description: description.trim() || undefined,
        purpose,
        tags,
      });

      addToast('success', 'Prompt updated successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating prompt:', error);
      addToast('error', 'Failed to update prompt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Prompt"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Save Changes
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Code Review Assistant"
          error={errors.name}
          required
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of what this prompt does..."
          rows={3}
          error={errors.description}
        />

        <Select
          label="Purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          options={purposeOptions}
          error={errors.purpose}
          required
        />

        <Input
          label="Tags"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="e.g., python, code-review, best-practices"
          helperText="Separate multiple tags with commas"
          error={errors.tags}
          required
        />
      </form>
    </Modal>
  );
};
