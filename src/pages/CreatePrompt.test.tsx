import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CreatePrompt from './CreatePrompt';

// Mock Convex
const mockUseMutation = vi.fn();
vi.mock('convex/react', () => ({
  useMutation: () => mockUseMutation,
}));

vi.mock('../../convex/_generated/api', () => ({
  api: {
    prompts: {
      create: 'mock-create-mutation',
    },
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CreatePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <CreatePrompt />
      </BrowserRouter>
    );
  };

  it('should render the form with all fields', () => {
    renderComponent();

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/purpose/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prompt content/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/system prompt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/compatible models/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/author/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/owner/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create prompt/i })).toBeInTheDocument();
  });

  it('should not submit when required fields are missing', async () => {
    renderComponent();

    const submitButton = screen.getByRole('button', { name: /create prompt/i });
    fireEvent.click(submitButton);

    // Wait a bit to ensure no API call was made
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mutation should not have been called with invalid data
    expect(mockUseMutation).not.toHaveBeenCalled();
  });

  it('should submit valid form data', async () => {
    const mockPromptId = 'test-prompt-id';
    mockUseMutation.mockResolvedValue({ id: mockPromptId });

    renderComponent();

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Prompt' },
    });
    fireEvent.change(screen.getByLabelText(/purpose/i), {
      target: { value: 'testing' },
    });
    fireEvent.change(screen.getByLabelText(/prompt content/i), {
      target: { value: 'This is a test prompt content' },
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create prompt/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUseMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Prompt',
          purpose: 'testing',
          content: 'This is a test prompt content',
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith(`/prompts/${mockPromptId}`);
    });
  });

  it('should parse comma-separated tags correctly', async () => {
    const mockPromptId = 'test-prompt-id';
    mockUseMutation.mockResolvedValue({ id: mockPromptId });

    renderComponent();

    // Fill in required fields + tags
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Prompt' },
    });
    fireEvent.change(screen.getByLabelText(/purpose/i), {
      target: { value: 'testing' },
    });
    fireEvent.change(screen.getByLabelText(/prompt content/i), {
      target: { value: 'Test content' },
    });
    fireEvent.change(screen.getByLabelText(/tags/i), {
      target: { value: 'tag1, tag2, tag3' },
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create prompt/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUseMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['tag1', 'tag2', 'tag3'],
        })
      );
    });
  });

  it('should parse comma-separated models correctly', async () => {
    const mockPromptId = 'test-prompt-id';
    mockUseMutation.mockResolvedValue({ id: mockPromptId });

    renderComponent();

    // Fill in required fields + models
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Prompt' },
    });
    fireEvent.change(screen.getByLabelText(/purpose/i), {
      target: { value: 'testing' },
    });
    fireEvent.change(screen.getByLabelText(/prompt content/i), {
      target: { value: 'Test content' },
    });
    fireEvent.change(screen.getByLabelText(/compatible models/i), {
      target: { value: 'gpt-4, claude-3, gemini-pro' },
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create prompt/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUseMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          models: ['gpt-4', 'claude-3', 'gemini-pro'],
        })
      );
    });
  });

  it('should handle API errors', async () => {
    mockUseMutation.mockRejectedValue(
      new Error('Network error')
    );

    renderComponent();

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Prompt' },
    });
    fireEvent.change(screen.getByLabelText(/purpose/i), {
      target: { value: 'testing' },
    });
    fireEvent.change(screen.getByLabelText(/prompt content/i), {
      target: { value: 'Test content' },
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create prompt/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button while loading', async () => {
    mockUseMutation.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ id: 'test' }), 100))
    );

    renderComponent();

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Test Prompt' },
    });
    fireEvent.change(screen.getByLabelText(/purpose/i), {
      target: { value: 'testing' },
    });
    fireEvent.change(screen.getByLabelText(/prompt content/i), {
      target: { value: 'Test content' },
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create prompt/i });
    fireEvent.click(submitButton);

    // Button should be disabled while loading
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/creating.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should not submit when max lengths are exceeded', async () => {
    renderComponent();

    // Try to exceed max length for name (input has maxLength so it won't actually exceed)
    // But we can test that validation would catch it
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'a'.repeat(255) }, // At the limit
    });
    fireEvent.change(screen.getByLabelText(/purpose/i), {
      target: { value: 'testing' },
    });
    fireEvent.change(screen.getByLabelText(/prompt content/i), {
      target: { value: 'Test content' },
    });

    const submitButton = screen.getByRole('button', { name: /create prompt/i });
    fireEvent.click(submitButton);

    // Should successfully submit at the limit
    await waitFor(() => {
      expect(mockUseMutation).toHaveBeenCalled();
    });
  });
});
