'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { initializeDatabase, checkDatabaseSetup } from '@/lib/actions';
import { toast } from '@/hooks/use-toast';
import {
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DatabaseHealthCheckProps {
  onHealthChange?: (isHealthy: boolean) => void;
  showDetails?: boolean;
}

export function DatabaseHealthCheck({
  onHealthChange,
  showDetails = false,
}: DatabaseHealthCheckProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    isSetup: boolean;
    issues: string[];
    recommendations: string[];
  } | null>(null);
  const [initializationResult, setInitializationResult] = useState<{
    success: boolean;
    message: string;
    migrations: any[];
    validation: any;
  } | null>(null);

  const checkHealth = async () => {
    setIsLoading(true);
    try {
      const result = await checkDatabaseSetup();
      setHealthStatus(result);
      onHealthChange?.(result.isSetup);
    } catch (error) {
      toast({
        title: 'Health Check Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeDatabase = async () => {
    setIsInitializing(true);
    try {
      const result = await initializeDatabase();
      setInitializationResult(result);

      if (result.success) {
        toast({
          title: 'Database Initialized',
          description:
            'Email database functionality has been set up successfully',
          variant: 'default',
        });
        // Re-check health after initialization
        await checkHealth();
      } else {
        toast({
          title: 'Initialization Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Initialization Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusIcon = () => {
    if (!healthStatus) return <Database className="h-5 w-5 text-gray-400" />;
    if (healthStatus.isSetup)
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (healthStatus.issues.length > 0)
      return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusBadge = () => {
    if (!healthStatus) return <Badge variant="secondary">Unknown</Badge>;
    if (healthStatus.isSetup)
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          Healthy
        </Badge>
      );
    if (healthStatus.issues.length > 0)
      return <Badge variant="destructive">Issues</Badge>;
    return <Badge variant="secondary">Warning</Badge>;
  };

  if (!showDetails && healthStatus?.isSetup) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        Database Ready
      </div>
    );
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <Card className={`w-full ${isMinimized ? 'py-2' : ''}`}>
      <CardHeader className={isMinimized ? 'py-2' : ''}>
        <div className="flex items-center justify-between">
          <CardTitle
            className={`flex items-center gap-2 ${
              isMinimized ? 'text-sm' : ''
            }`}
          >
            {getStatusIcon()}
            Database Health Check
            {getStatusBadge()}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMinimize}
            className="h-6 w-6 p-0"
          >
            {!isMinimized ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </Button>
        </div>
        {!isMinimized && (
          <CardDescription>
            Monitor database setup and email functionality status
          </CardDescription>
        )}
      </CardHeader>
      {!isMinimized && (
        <CardContent className="space-y-4">
          {/* Health Status */}
          {!isMinimized && healthStatus && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <div className="flex items-center gap-2">
                  {getStatusBadge()}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkHealth}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-1 ${
                        isLoading ? 'animate-spin' : ''
                      }`}
                    />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Issues */}
              {healthStatus.issues.length > 0 && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Issues Found:</div>
                      <ul className="list-disc list-inside text-sm">
                        {healthStatus.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Recommendations */}
              {healthStatus.recommendations.length > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Recommendations:</div>
                      <ul className="list-disc list-inside text-sm">
                        {healthStatus.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Initialization Section */}
          {!isMinimized && healthStatus && !healthStatus.isSetup && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">
                    Database Initialization
                  </h4>
                  <p className="text-xs text-gray-500">
                    Set up email functionality in the database
                  </p>
                </div>
                <Button
                  onClick={handleInitializeDatabase}
                  disabled={isInitializing}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {isInitializing ? 'Initializing...' : 'Initialize'}
                </Button>
              </div>

              {initializationResult && (
                <Alert
                  variant={
                    initializationResult.success ? 'default' : 'destructive'
                  }
                >
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">
                        {initializationResult.success
                          ? 'Initialization Successful'
                          : 'Initialization Failed'}
                      </div>
                      <div className="text-sm">
                        {initializationResult.message}
                      </div>

                      {initializationResult.migrations.length > 0 && (
                        <div className="text-xs">
                          <div className="font-medium">Migrations:</div>
                          <ul className="list-disc list-inside">
                            {initializationResult.migrations.map(
                              (migration, index) => (
                                <li key={index}>
                                  {migration.success ? '✅' : '❌'}{' '}
                                  {migration.message}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Migration Details */}
          {!isMinimized && showDetails && initializationResult && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Migration Details</h4>
              <div className="text-xs space-y-1">
                {initializationResult.migrations.map((migration, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                  >
                    {migration.success ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span className="flex-1">{migration.message}</span>
                    <Badge variant="outline" className="text-xs">
                      {migration.recordsUpdated} records
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
