import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Wifi, WifiOff } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { Card, StatCard, StatusIndicator, EmptyState, Button } from '../components/ui';
import { useNodes } from '../api/client';
import { useCurrentNetworkId, useAppStore } from '../store';
import type { Node } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const networkId = useCurrentNetworkId();
  const { setCurrentNetworkId } = useAppStore();

  const { data: nodes, isLoading: nodesLoading } = useNodes(networkId || '');

  if (!networkId) {
    return (
      <EmptyState
        icon={<Server className="w-12 h-12" />}
        title="No network selected"
        description="Select a network from the sidebar to view the dashboard"
      />
    );
  }

  const onlineNodes = nodes?.filter((n) => n.status === 'online').length || 0;
  const totalNodes = nodes?.length || 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your mesh network"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatCard
          title="Online Nodes"
          value={`${onlineNodes} / ${totalNodes}`}
          icon={<Server className="w-6 h-6 text-blue-600" />}
        />
        <StatCard
          title="Total Nodes"
          value={totalNodes}
          icon={<Server className="w-6 h-6 text-purple-600" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Recent Nodes */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nodes</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/nodes')}>
              View all
            </Button>
          </div>
          
          {nodesLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          ) : nodes && nodes.length > 0 ? (
            <div className="space-y-3">
              {nodes.slice(0, 5).map((node) => (
                <NodeRow key={node.id} node={node} onClick={() => navigate(`/nodes/${node.id}`)} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No nodes"
              description="Add your first node to the network"
            />
          )}
        </Card>
      </div>
    </div>
  );
};

// Node row component
const NodeRow: React.FC<{ node: Node; onClick: () => void }> = ({ node, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          {node.status === 'online' ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{node.name}</p>
          <p className="text-sm text-gray-500">{node.virtual_ip}</p>
        </div>
      </div>
      <StatusIndicator status={node.status} />
    </div>
  );
};



export default DashboardPage;
