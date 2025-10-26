'use client';

/**
 * Peer Calibration Opt-In Dialog
 *
 * Privacy-first consent dialog for peer calibration data sharing.
 * Explains data usage, anonymization, and opt-out process.
 *
 * Story 4.4 Task 9: Peer Calibration Comparison - Privacy Opt-In
 */

import React, { useState } from 'react';
import { Shield, Users, Eye, X, Check } from 'lucide-react';

interface PeerCalibrationOptInDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOptIn: () => Promise<void>;
  userId?: string;
}

export function PeerCalibrationOptInDialog({
  isOpen,
  onClose,
  onOptIn,
  userId,
}: PeerCalibrationOptInDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOptIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          sharePeerCalibrationData: true,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.message || 'Failed to enable peer comparison');
        return;
      }

      await onOptIn();
      onClose();
    } catch (err) {
      console.error('Opt-in error:', err);
      setError('Failed to enable peer comparison');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-card ">
      <div className="bg-card  rounded-lg shadow-none max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[oklch(0.8_0.05_240)]">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[oklch(0.6_0.18_230)]" />
            <h2 className="text-xl font-bold" style={{ fontFamily: 'DM Sans, sans-serif' }}>
              Enable Peer Comparison
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[oklch(0.9_0.05_240)] rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6" style={{ fontFamily: 'Inter, sans-serif' }}>
          {/* Introduction */}
          <p className="text-[oklch(0.4_0.05_240)]">
            Compare your confidence calibration accuracy with other students to better understand your metacognitive
            skills.
          </p>

          {/* What You'll Share Section */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2 text-[oklch(0.4_0.05_240)]">
              <Shield className="w-5 h-5 text-[oklch(0.6_0.18_230)]" />
              What You'll Share
            </h3>
            <ul className="space-y-2 text-sm text-[oklch(0.5_0.05_240)]">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[oklch(0.7_0.15_145)] flex-shrink-0 mt-0.5" />
                <span>Your calibration correlation coefficient (anonymized)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-[oklch(0.7_0.15_145)] flex-shrink-0 mt-0.5" />
                <span>Topics where you show overconfidence/underconfidence patterns (anonymized)</span>
              </li>
            </ul>
          </div>

          {/* What You Won't Share Section */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2 text-[oklch(0.4_0.05_240)]">
              <Eye className="w-5 h-5 text-[oklch(0.65_0.20_25)]" />
              What You Won't Share
            </h3>
            <ul className="space-y-2 text-sm text-[oklch(0.5_0.05_240)]">
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-[oklch(0.65_0.20_25)] flex-shrink-0 mt-0.5" />
                <span>Your name or identifying information</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-[oklch(0.65_0.20_25)] flex-shrink-0 mt-0.5" />
                <span>Individual assessment responses or scores</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-4 h-4 text-[oklch(0.65_0.20_25)] flex-shrink-0 mt-0.5" />
                <span>Your study time or session details</span>
              </li>
            </ul>
          </div>

          {/* Privacy Protection */}
          <div className="p-4 rounded-lg bg-[oklch(0.6_0.18_230)] bg-opacity-10 border border-[oklch(0.6_0.18_230)] border-opacity-20">
            <h3 className="font-semibold mb-2 text-[oklch(0.4_0.05_240)]">Privacy Protection</h3>
            <ul className="space-y-2 text-sm text-[oklch(0.5_0.05_240)]">
              <li>• All data is completely anonymized - no one can identify you</li>
              <li>• Minimum 20 students required for comparisons (prevents identification)</li>
              <li>• Only aggregated statistics are shown</li>
              <li>• You can opt-out anytime in settings</li>
            </ul>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <h3 className="font-semibold text-[oklch(0.4_0.05_240)]">Benefits</h3>
            <ul className="space-y-2 text-sm text-[oklch(0.5_0.05_240)]">
              <li>• See how your calibration accuracy ranks among peers</li>
              <li>• Identify common overconfidence areas to avoid</li>
              <li>• Understand if your metacognitive skills need improvement</li>
              <li>• Motivate improvement through peer benchmarking</li>
            </ul>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-[oklch(0.65_0.20_25)] bg-opacity-10 border border-[oklch(0.65_0.20_25)] text-sm text-[oklch(0.65_0.20_25)]">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[oklch(0.8_0.05_240)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg hover:bg-[oklch(0.9_0.05_240)] transition-colors"
            style={{ fontFamily: 'Inter, sans-serif' }}
            disabled={loading}
          >
            Not Now
          </button>
          <button
            onClick={handleOptIn}
            disabled={loading}
            className="px-6 py-2 bg-[oklch(0.6_0.18_230)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {loading ? 'Enabling...' : 'Enable Peer Comparison'}
          </button>
        </div>
      </div>
    </div>
  );
}
