import React, { useState } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldOff, 
  RefreshCw, 
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  List
} from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { Card, Button, Badge } from '../components/ui';
import { useFail2BanStatus, useFail2BanLogs, useUnbanIP } from '../api/client';

export const Fail2BanPage: React.FC = () => {
  const [selectedJail, setSelectedJail] = useState<string | null>(null);
  const [logLines, setLogLines] = useState(100);
  
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useFail2BanStatus();
  const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useFail2BanLogs(logLines);
  const unbanMutation = useUnbanIP();

  const handleUnban = async (jail: string, ip: string) => {
    if (confirm(`Unban IP ${ip} from jail ${jail}?`)) {
      await unbanMutation.mutateAsync({ jail, ip });
    }
  };

  const handleRefresh = () => {
    refetchStatus();
    refetchLogs();
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!status?.installed) {
    return (
      <div className="space-y-6">
        <PageHeader title="Fail2Ban" description="Intrusion prevention system" />
        <Card className="text-center py-12">
          <ShieldOff className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Fail2Ban Not Installed
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Fail2Ban is not installed on this server. Install it to protect against brute-force attacks.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Fail2Ban" 
        description="Intrusion prevention and banned IPs management"
      />

      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {status.running ? (
            <Badge variant="success" size="md">
              <CheckCircle className="w-4 h-4 mr-1" /> Running
            </Badge>
          ) : (
            <Badge variant="danger" size="md">
              <XCircle className="w-4 h-4 mr-1" /> Stopped
            </Badge>
          )}
          <span className="text-sm text-gray-500">
            {status.jails.length} jail{status.jails.length !== 1 ? 's' : ''} configured
          </span>
        </div>
        <Button variant="secondary" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Jails Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {status.jails.map((jail) => (
          <Card 
            key={jail.name}
            className={`cursor-pointer transition-all ${
              selectedJail === jail.name 
                ? 'ring-2 ring-blue-500 border-blue-500' 
                : 'hover:border-gray-400'
            }`}
            onClick={() => setSelectedJail(selectedJail === jail.name ? null : jail.name)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">{jail.name}</h3>
              </div>
              {(jail.banned_count || 0) > 0 && (
                <Badge variant="danger">{jail.banned_count} banned</Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                <p className="text-gray-500 dark:text-gray-400">Currently Banned</p>
                <p className="text-lg font-bold text-red-500">{jail.banned_count || 0}</p>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                <p className="text-gray-500 dark:text-gray-400">Total Banned</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{jail.total_banned || 0}</p>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                <p className="text-gray-500 dark:text-gray-400">Failed Attempts</p>
                <p className="text-lg font-bold text-orange-500">{jail.failed_count || 0}</p>
              </div>
              <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                <p className="text-gray-500 dark:text-gray-400">Total Failed</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{jail.total_failed || 0}</p>
              </div>
            </div>

            {/* Banned IPs */}
            {selectedJail === jail.name && jail.banned_ips && jail.banned_ips.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Banned IPs
                </h4>
                <div className="space-y-2">
                  {jail.banned_ips.map((ip) => (
                    <div 
                      key={ip}
                      className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded"
                    >
                      <span className="font-mono text-sm text-red-700 dark:text-red-300">{ip}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnban(jail.name, ip);
                        }}
                        loading={unbanMutation.isPending}
                      >
                        <Unlock className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Logs Section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Logs</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={logLines}
              onChange={(e) => setLogLines(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            >
              <option value={50}>Last 50</option>
              <option value={100}>Last 100</option>
              <option value={200}>Last 200</option>
              <option value={500}>Last 500</option>
            </select>
            <Button variant="ghost" size="sm" onClick={() => refetchLogs()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {logsLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : logs?.error ? (
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p>{logs.error}</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-1 font-mono text-xs">
              {logs?.logs.map((log, index) => (
                <div 
                  key={index}
                  className={`p-2 rounded ${
                    log.action === 'ban' 
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : log.action === 'unban'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : log.action === 'found'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                      : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {log.timestamp && (
                    <span className="text-gray-500 dark:text-gray-400 mr-2">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {log.timestamp}
                    </span>
                  )}
                  {log.action && (
                    <Badge 
                      variant={
                        log.action === 'ban' ? 'danger' : 
                        log.action === 'unban' ? 'success' : 'warning'
                      }
                      size="sm"
                    >
                      {log.action.toUpperCase()}
                    </Badge>
                  )}
                  <span className="ml-2 break-all">{log.raw}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Fail2BanPage;
