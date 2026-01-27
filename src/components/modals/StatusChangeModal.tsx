import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Modal, Button, Select, Textarea } from '../ui';
import { useToast } from '../ui/Toast';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptId: Id<'prompts'>;
  currentStatus: string;
  onSuccess?: () => void;
}

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In Review' },
  { value: 'testing', label: 'Testing' },
  { value: 'active', label: 'Active' },
  { value: 'deprecated', label: 'Deprecated' },
  { value: 'archived', label: 'Archived' },
];

const statusDescriptions: Record<string, string> = {
  draft: 'Work in progress, not ready for use',
  in_review: 'Under review by team members',
  testing: 'Being tested before activation',
  active: 'Ready for production use',
  deprecated: 'No longer recommended, will be replaced',
  archived: 'No longer in use, kept for reference',
};

export const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  promptId,
  currentStatus,
  onSuccess,
}) => {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateStatus = useMutation(api.prompts.updateStatus);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newStatus === currentStatus) {
      addToast('info', 'Status unchanged');
      onClose();
      return;
    }

    setIsSubmitting(true);

    try {
      await updateStatus({
        id: promptId,
        status: newStatus as any,
        comment: comment.trim() || undefined,
      });

      addToast('success', `Status changed to ${newStatus}`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
      addToast('error', 'Failed to update status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNewStatus(currentStatus);
    setComment('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Status"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={isSubmitting}>
            Update Status
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Current Status
          </label>
          <div className="px-3 py-2 bg-zinc-900 border border-[var(--pl-border)] text-gray-400">
            {statusOptions.find((s) => s.value === currentStatus)?.label || currentStatus}
          </div>
        </div>

        <Select
          label="New Status"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          options={statusOptions}
          required
        />

        {newStatus && statusDescriptions[newStatus] && (
          <div className="text-sm text-gray-400 bg-[var(--pl-surface)] border border-[var(--pl-border)] p-3">
            {statusDescriptions[newStatus]}
          </div>
        )}

        <Textarea
          label="Comment (Optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a note about this status change..."
          rows={3}
        />
      </form>
    </Modal>
  );
};
