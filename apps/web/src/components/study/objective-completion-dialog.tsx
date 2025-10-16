'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';

interface ObjectiveCompletionDialogProps {
  open: boolean;
  objectiveName: string;
  onComplete: (data: {
    selfAssessment: number;
    confidenceRating: number;
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function ObjectiveCompletionDialog({
  open,
  objectiveName,
  onComplete,
  onCancel,
}: ObjectiveCompletionDialogProps) {
  const [selfAssessment, setSelfAssessment] = useState(3);
  const [confidenceRating, setConfidenceRating] = useState(3);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onComplete({
        selfAssessment,
        confidenceRating,
        notes: notes.trim() || undefined,
      });
    } catch (error) {
      console.error('Failed to complete objective:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium" style={{ color: 'oklch(0.4 0.15 250)' }}>
        {label}
      </label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <Star
              className="w-8 h-8"
              fill={star <= value ? 'oklch(0.7 0.15 60)' : 'none'}
              stroke={star <= value ? 'oklch(0.7 0.15 60)' : 'oklch(0.7 0.05 250)'}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Objective</DialogTitle>
          <DialogDescription>{objectiveName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <StarRating
            value={selfAssessment}
            onChange={setSelfAssessment}
            label="How well did you understand this?"
          />

          <StarRating
            value={confidenceRating}
            onChange={setConfidenceRating}
            label="How confident are you?"
          />

          <div className="space-y-2">
            <label className="text-sm font-medium" style={{ color: 'oklch(0.4 0.15 250)' }}>
              Reflection Notes (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you learn? What was challenging?"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={submitting} className="min-h-[44px]">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="min-h-[44px]"
            style={{
              background: 'oklch(0.65 0.2 140)',
              color: 'oklch(1 0 0)',
            }}
          >
            {submitting ? 'Completing...' : 'Complete Objective'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
