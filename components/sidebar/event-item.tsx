'use client';

import { IEvent } from '@/lib/types';
import { format } from 'date-fns';
import {
  Calendar,
  Users,
  FileText,
  MoreVertical,
  Edit,
  Copy,
  Archive,
  Trash2,
  RotateCcw,
  Check,
  X,
  Settings,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState, useEffect } from 'react';
import { updateEvent } from '@/lib/actions';
import { toast } from '@/hooks/use-toast';
import { EmailConfigDialog } from '../email/email-config-dialog';

interface EventItemProps {
  event: IEvent;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: (event: IEvent) => void;
  onDuplicate?: (eventId: string) => Promise<void>;
  onArchive?: (eventId: string) => Promise<void>;
  onUnarchive?: (eventId: string) => Promise<void>;
  onSoftDelete?: (eventId: string) => Promise<void>;
  onRestore?: (eventId: string) => Promise<void>;
  onEventUpdate?: (event: IEvent) => void;
  onEventsChange?: () => void;
}

export function EventItem({
  event,
  isSelected,
  onClick,
  onEdit,
  onDuplicate,
  onArchive,
  onUnarchive,
  onSoftDelete,
  onRestore,
  onEventUpdate,
  onEventsChange,
}: EventItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: event.title,
    description: event.description || '',
    eventDate: format(new Date(event.eventDate), 'yyyy-MM-dd'),
  });

  const getEventStatus = (event: IEvent) => {
    if (event.isDeleted) return 'deleted';
    if (event.status === 'archived') return 'archived';
    if (!event.template.base64) return 'no-template';
    if (event.participants.length === 0) return 'no-participants';
    if (!event.emailConfig || !event.emailConfig.enabled)
      return 'no-email-config';
    return 'ready';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'no-template':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'no-participants':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'no-email-config':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'deleted':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'no-template':
        return 'No Template';
      case 'no-participants':
        return 'No Participants';
      case 'no-email-config':
        return 'No Email Config';
      case 'archived':
        return 'Archived';
      case 'deleted':
        return 'Deleted';
      default:
        return 'Unknown';
    }
  };

  const status = getEventStatus(event);

  const handleAction = async (action: () => Promise<void>) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await action();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (onSoftDelete && event._id) {
      handleAction(() => onSoftDelete(event._id!.toString()));
    }
    setShowDeleteDialog(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditData({
      title: event.title,
      description: event.description || '',
      eventDate: format(new Date(event.eventDate), 'yyyy-MM-dd'),
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      title: event.title,
      description: event.description || '',
      eventDate: format(new Date(event.eventDate), 'yyyy-MM-dd'),
    });
  };

  const handleSaveEdit = async () => {
    if (!event._id) return;

    try {
      setIsLoading(true);
      const updatedEvent = await updateEvent(event._id.toString(), {
        title: editData.title,
        description: editData.description,
        eventDate: new Date(editData.eventDate),
      });

      if (updatedEvent) {
        onEventUpdate?.(updatedEvent);
        onEventsChange?.(); // Refetch the event list
        toast({
          title: 'Event Updated',
          description: 'Event details have been updated successfully.',
        });
        setIsEditing(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update event.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing) return;

      if (e.key === 'Escape') {
        handleCancelEdit();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSaveEdit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, editData]);

  return (
    <>
      <div
        className={`
          w-full text-left p-3 rounded-lg transition-colors group relative
          ${
            isSelected
              ? 'bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
          }
          ${event.isDeleted ? 'opacity-60' : ''}
        `}
        data-testid={`event-item-${event._id}`}
      >
        <div className="flex items-start gap-3">
          {/* Diamond Icon */}
          {/* <div className="flex-shrink-0 mt-1">
            <div className="w-4 h-4">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className={`w-full h-full ${
                  isSelected
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400'
                }`}
              >
                <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                <path d="M2 17L12 22L22 17" />
                <path d="M2 12L12 17L22 12" />
              </svg>
            </div>
          </div> */}

          {/* Event Content */}
          <div
            className="flex-1 min-w-0"
            onClick={!isEditing ? onClick : undefined}
          >
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editData.title}
                  onChange={(e) =>
                    setEditData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Event title"
                  className="h-8 text-sm"
                  autoFocus
                />
                <Textarea
                  value={editData.description}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Event description (optional)"
                  className="min-h-[60px] text-xs resize-none"
                />
                <Input
                  type="date"
                  value={editData.eventDate}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      eventDate: e.target.value,
                    }))
                  }
                  className="h-8 text-xs w-fit"
                />
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {event.participants.length} participants
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {event.template.base64 ? 'Template' : 'No Template'}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                    {event.title}
                  </h4>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      status
                    )}`}
                  >
                    {getStatusText(status)}
                  </span>
                </div>

                {event.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                    {event.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1 truncate">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(event.eventDate), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {event.participants.length}
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {event.template.base64 ? 'Template' : 'No Template'}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Actions Menu */}
          <div className="flex-shrink-0">
            {isEditing ? (
              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        disabled={isLoading || !editData.title.trim()}
                        className="h-6 w-6 p-0"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Save (Ctrl+Enter)</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cancel (Esc)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    disabled={isLoading}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleStartEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Event
                  </DropdownMenuItem>

                  {onDuplicate && !event.isDeleted && (
                    <DropdownMenuItem
                      onClick={() =>
                        handleAction(() => onDuplicate(event._id!.toString()))
                      }
                      disabled={isLoading}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  {event.status === 'archived'
                    ? onUnarchive && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleAction(() =>
                              onUnarchive(event._id!.toString())
                            )
                          }
                          disabled={isLoading}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Unarchive
                        </DropdownMenuItem>
                      )
                    : onArchive &&
                      !event.isDeleted && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleAction(() => onArchive(event._id!.toString()))
                          }
                          disabled={isLoading}
                        >
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      )}

                  {event.isDeleted
                    ? onRestore && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleAction(() => onRestore(event._id!.toString()))
                          }
                          disabled={isLoading}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Restore
                        </DropdownMenuItem>
                      )
                    : onSoftDelete && (
                        <DropdownMenuItem
                          onClick={() => setShowDeleteDialog(true)}
                          disabled={isLoading}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Email Configuration Dialog */}
        {event && (
          <div className="mt-2">
            <EmailConfigDialog
              eventId={event._id!.toString()}
              currentConfig={event.emailConfig}
              currentTemplate={event.emailTemplate}
              onConfigUpdate={onEventsChange}
            >
              <Button variant="outline" size="sm" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Email Settings
              </Button>
            </EmailConfigDialog>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{event.title}"? This action can
              be undone by restoring the event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
