'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  EmailValidationService,
  ValidationContext,
} from '@/lib/email-validation-service';
import {
  IEvent,
  IRecipientData,
  IEmailConfig,
  IEmailTemplate,
} from '@/lib/types';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  RefreshCw,
  Mail,
  Settings,
  Users,
  FileText,
} from 'lucide-react';

interface EmailValidationFeedbackProps {
  event?: IEvent;
  participant?: IRecipientData;
  participants?: IRecipientData[];
  config?: IEmailConfig;
  template?: IEmailTemplate;
  context: ValidationContext;
  onValidationChange?: (isValid: boolean) => void;
  showDetails?: boolean;
  autoValidate?: boolean;
}

export function EmailValidationFeedback({
  event,
  participant,
  participants,
  config,
  template,
  context,
  onValidationChange,
  showDetails = false,
  autoValidate = true,
}: EmailValidationFeedbackProps) {
  const [validation, setValidation] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);

  const validate = useCallback(async () => {
    if (!event) return;

    setIsValidating(true);
    try {
      let result;

      if (context.operation === 'bulk_send' && participants) {
        result = await EmailValidationService.validateBulkEmailSendingContext(
          event,
          participants,
          context
        );
      } else if (context.operation === 'send' && participant) {
        result = await EmailValidationService.validateEmailSendingContext(
          event,
          participant,
          context
        );
      } else if (context.operation === 'config' && config) {
        result = EmailValidationService.validateEmailConfiguration(config);
      } else if (context.operation === 'test' && template) {
        result = EmailValidationService.validateEmailTemplate(template);
      } else {
        result = EmailValidationService.validateEventForEmail(event);
      }

      setValidation(result);
      setLastValidated(new Date());
      onValidationChange?.(result.isValid);
    } catch (error) {
      console.error('Validation error:', error);
      setValidation({
        isValid: false,
        errors: [{ userMessage: 'Validation failed due to an error' }],
        warnings: [],
      });
      onValidationChange?.(false);
    } finally {
      setIsValidating(false);
    }
  }, [
    event,
    participant,
    participants,
    config,
    template,
    context,
    onValidationChange,
  ]);

  useEffect(() => {
    if (autoValidate) {
      validate();
    }
  }, [autoValidate, validate]);

  const getStatusIcon = () => {
    if (!validation) return <Info className="h-5 w-5 text-gray-400" />;
    if (validation.isValid && validation.warnings.length === 0) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (validation.isValid && validation.warnings.length > 0) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = () => {
    if (!validation) return <Badge variant="secondary">Not Validated</Badge>;
    if (validation.isValid && validation.warnings.length === 0) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Valid
        </Badge>
      );
    }
    if (validation.isValid && validation.warnings.length > 0) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Warnings
        </Badge>
      );
    }
    return <Badge variant="destructive">Errors</Badge>;
  };

  const getContextIcon = () => {
    switch (context.operation) {
      case 'send':
        return <Mail className="h-4 w-4" />;
      case 'bulk_send':
        return <Users className="h-4 w-4" />;
      case 'config':
        return <Settings className="h-4 w-4" />;
      case 'test':
        return <FileText className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  if (!showDetails && validation?.isValid) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        Validation Passed
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Email Validation
          {getStatusBadge()}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          {getContextIcon()}
          {context.operation.replace('_', ' ').toUpperCase()} Validation
          {lastValidated && (
            <span className="text-xs text-gray-500">
              • Last checked: {lastValidated.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Summary */}
        {validation && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Button
                variant="outline"
                size="sm"
                onClick={validate}
                disabled={isValidating}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${
                    isValidating ? 'animate-spin' : ''
                  }`}
                />
                Refresh
              </Button>
            </div>

            {/* Errors */}
            {validation.errors && validation.errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">
                      Errors ({validation.errors.length}):
                    </div>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {validation.errors.map((error: any, index: number) => (
                        <li key={index}>
                          {error.userMessage || error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {validation.warnings && validation.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">
                      Warnings ({validation.warnings.length}):
                    </div>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {validation.warnings.map(
                        (warning: string, index: number) => (
                          <li key={index}>{warning}</li>
                        )
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {validation.isValid &&
              validation.errors.length === 0 &&
              validation.warnings.length === 0 && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    All validations passed successfully. Email sending is ready.
                  </AlertDescription>
                </Alert>
              )}
          </div>
        )}

        {/* Validation Details */}
        {showDetails && validation && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Validation Details</h4>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Errors:</span>
                <span className="font-mono">
                  {validation.errors?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Warnings:</span>
                <span className="font-mono">
                  {validation.warnings?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Valid:</span>
                <span className="font-mono">
                  {validation.isValid ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        {validation && !validation.isValid && (
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium">To fix these issues:</p>
            <ul className="list-disc list-inside space-y-1">
              {validation.errors?.map((error: any, index: number) => (
                <li key={index}>
                  {error.type === 'VALIDATION_ERROR' &&
                    'Check the field values and format'}
                  {error.type === 'SMTP_CONNECTION_ERROR' &&
                    'Verify your SMTP server settings'}
                  {error.type === 'AUTHENTICATION_ERROR' &&
                    'Check your email username and password'}
                  {error.type === 'TEMPLATE_ERROR' &&
                    'Review your email template configuration'}
                  {error.type === 'CONFIGURATION_ERROR' &&
                    'Update your email configuration'}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
