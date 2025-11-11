'use client';

import { useEffect, useState } from 'react';
import type {
  Node,
  Edge,
  Connection,
} from 'reactflow';

interface ReactFlowWrapperProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  onConnect: (params: Connection) => void;
  onNodeDoubleClick: (event: React.MouseEvent, node: Node) => void;
  selectedNode: Node | null;
  setSelectedNode: (node: Node | null) => void;
}

export default function ReactFlowWrapper({
  nodes: initialNodes,
  edges: initialEdges,
  setNodes: setNodesExternal,
  setEdges: setEdgesExternal,
  onConnect,
  onNodeDoubleClick,
  selectedNode,
  setSelectedNode,
}: ReactFlowWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [FlowComponent, setFlowComponent] = useState<React.ComponentType<any> | null>(null);

  // 클라이언트에서만 React Flow 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadReactFlow = async () => {
      try {
        // Flow 컴포넌트를 동적으로 import (이미 클라이언트 전용으로 설정됨)
        const { default: Flow } = await import('./FlowComponent');
        
        setFlowComponent(() => Flow);
        setIsMounted(true);
      } catch (error) {
        console.error('Failed to load React Flow:', error);
      }
    };

    loadReactFlow();
  }, []);

  // React Flow가 완전히 로드된 후에만 렌더링
  if (!FlowComponent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">플로우 에디터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <FlowComponent
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      setNodesExternal={setNodesExternal}
      setEdgesExternal={setEdgesExternal}
      onConnect={onConnect}
      onNodeDoubleClick={onNodeDoubleClick}
    />
  );
}
