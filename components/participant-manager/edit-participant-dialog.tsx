'use client';

import { useState, useEffect } from 'react';
import { IRecipientData } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Mail, Hash } from 'lucide-react';

interface EditParticipantDialogProps {
  participant: IRecipientData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedParticipant: IRecipientData) => Promise<void>;
  isLoading?: boolean;
}

export function EditParticipantDialog({
  participant,
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: EditParticipantDialogProps) {
  const [formData, setFormData] = useState<IRecipientData>({
    name: '',
    certification_id: '',
    email: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when participant changes
  useEffect(() => {
    if (participant) {
      setFormData({
        name: participant.name,
        certification_id: participant.certification_id,
        email: participant.email || '',
      });
      setErrors({});
    }
  }, [participant]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Validate certification ID
    if (!formData.certification_id.trim()) {
      newErrors.certification_id = 'Certificate ID is required';
    } else if (formData.certification_id.trim().length < 3) {
      newErrors.certification_id =
        'Certificate ID must be at least 3 characters';
    }

    // Validate email (optional but if provided, should be valid)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof IRecipientData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedParticipant: IRecipientData = {
        name: formData.name.trim(),
        certification_id: formData.certification_id.trim(),
        email: formData.email.trim() || '',
      };

      await onSave(updatedParticipant);
      onClose();
    } catch (error) {
      console.error('Error saving participant:', error);
      setErrors({
        general: 'Failed to save participant. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!participant) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Participant
          </DialogTitle>
          <DialogDescription>
            Update the participant's information. All fields except email are
            required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* General Error */}
          {errors.general && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
              <AlertDescription className="text-red-800 dark:text-red-200">
                {errors.general}
              </AlertDescription>
            </Alert>
          )}

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter participant name"
              className={errors.name ? 'border-red-500' : ''}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter email address (optional)"
              className={errors.email ? 'border-red-500' : ''}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Certificate ID Field */}
          <div className="space-y-2">
            <Label
              htmlFor="certification_id"
              className="flex items-center gap-2"
            >
              <Hash className="h-4 w-4" />
              Certificate ID *
            </Label>
            <Input
              id="certification_id"
              value={formData.certification_id}
              onChange={(e) =>
                handleInputChange('certification_id', e.target.value)
              }
              placeholder="Enter certificate ID"
              className={errors.certification_id ? 'border-red-500' : ''}
              disabled={isSubmitting}
            />
            {errors.certification_id && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {errors.certification_id}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || isLoading}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
