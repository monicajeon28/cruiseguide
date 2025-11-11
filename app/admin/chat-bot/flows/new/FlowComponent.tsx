'use client';

import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import type {
  Node,
  Edge,
  Connection,
  NodeTypes,
} from 'reactflow';
import { FiMessageSquare, FiHelpCircle, FiCode, FiZap, FiCheckCircle, FiPlay } from 'react-icons/fi';
import { MdAutoAwesome } from 'react-icons/md';

interface FlowComponentProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  setNodesExternal: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void;
  setEdgesExternal: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  onConnect: (params: Connection) => void;
  onNodeDoubleClick: (event: React.MouseEvent, node: Node) => void;
}

export default function FlowComponent({
  initialNodes,
  initialEdges,
  setNodesExternal,
  setEdgesExternal,
  onConnect,
  onNodeDoubleClick,
}: FlowComponentProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [ReactFlow, setReactFlow] = useState<any>(null);
  const [ReactFlowProvider, setReactFlowProvider] = useState<any>(null);
  const [Background, setBackground] = useState<any>(null);
  const [Controls, setControls] = useState<any>(null);
  const [MiniMap, setMiniMap] = useState<any>(null);
  const [addEdge, setAddEdge] = useState<any>(null);
  const [useNodesState, setUseNodesState] = useState<any>(null);
  const [useEdgesState, setUseEdgesState] = useState<any>(null);
  const [Handle, setHandle] = useState<any>(null);
  const [Position, setPosition] = useState<any>(null);
  const [nodeTypes, setNodeTypes] = useState<NodeTypes | null>(null);
  
  const prevInitialNodesRef = useRef(initialNodes);
  const prevInitialEdgesRef = useRef(initialEdges);

  // 클라이언트에서만 React Flow 로드
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadReactFlow = async () => {
      try {
        const reactFlowModule = await import('reactflow');
        const ReactFlowDefault = reactFlowModule.default;
        const { ReactFlowProvider, Background, Controls, MiniMap, addEdge, Handle, Position, useNodesState, useEdgesState } = reactFlowModule;

        await import('reactflow/dist/style.css');

        setReactFlow(() => ReactFlowDefault);
        setReactFlowProvider(() => ReactFlowProvider);
        setBackground(() => Background);
        setControls(() => Controls);
        setMiniMap(() => MiniMap);
        setAddEdge(() => addEdge);
        setUseNodesState(() => useNodesState);
        setUseEdgesState(() => useEdgesState);
        setHandle(() => Handle);
        setPosition(() => Position);

        // 커스텀 노드 컴포넌트들 생성
        const StartNode = ({ data }: { data: any }) => (
          <div className="px-4 py-3 bg-green-500 text-white rounded-lg shadow-lg min-w-[150px] text-center font-semibold">
            <div className="flex items-center justify-center gap-2">
              <FiPlay />
              <span>시작</span>
            </div>
            {Handle && <Handle type="source" position={Position?.Bottom} className="!bg-green-600" />}
          </div>
        );

        const TextNode = ({ data }: { data: any }) => (
          <div className="px-4 py-3 bg-blue-500 text-white rounded-lg shadow-lg min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <FiMessageSquare />
              <span className="font-semibold">텍스트 메시지</span>
            </div>
            <div className="text-sm bg-white/20 rounded p-2">{data.content || '메시지를 입력하세요'}</div>
            {Handle && (
              <>
                <Handle type="target" position={Position?.Top} className="!bg-blue-600" />
                <Handle type="source" position={Position?.Bottom} className="!bg-blue-600" />
              </>
            )}
          </div>
        );

        const QuestionNode = ({ data }: { data: any }) => (
          <div className="px-4 py-3 bg-purple-500 text-white rounded-lg shadow-lg min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <FiHelpCircle />
              <span className="font-semibold">질문</span>
            </div>
            <div className="text-sm bg-white/20 rounded p-2 mb-2">{data.content || '질문을 입력하세요'}</div>
            {data.options && data.options.length > 0 && (
              <div className="text-xs space-y-1">
                {data.options.map((opt: string, idx: number) => (
                  <div key={idx} className="bg-white/20 rounded px-2 py-1">{idx + 1}. {opt}</div>
                ))}
              </div>
            )}
            {Handle && (
              <>
                <Handle type="target" position={Position?.Top} className="!bg-purple-600" />
                <Handle type="source" position={Position?.Bottom} className="!bg-purple-600" />
              </>
            )}
          </div>
        );

        const ConditionNode = ({ data }: { data: any }) => (
          <div className="px-4 py-3 bg-yellow-500 text-white rounded-lg shadow-lg min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <FiCode />
              <span className="font-semibold">조건 분기</span>
            </div>
            <div className="text-sm bg-white/20 rounded p-2">{data.condition || '조건을 입력하세요'}</div>
            {Handle && (
              <>
                <Handle type="target" position={Position?.Top} className="!bg-yellow-600" />
                <Handle type="source" position={Position?.Left} className="!bg-yellow-600 !top-1/3" />
                <Handle type="source" position={Position?.Right} className="!bg-yellow-600 !top-2/3" />
              </>
            )}
          </div>
        );

        const AINode = ({ data }: { data: any }) => (
          <div className="px-4 py-3 bg-pink-500 text-white rounded-lg shadow-lg min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <MdAutoAwesome />
              <span className="font-semibold">AI 응답</span>
            </div>
            <div className="text-sm bg-white/20 rounded p-2">{data.content || 'AI 프롬프트를 입력하세요'}</div>
            {Handle && (
              <>
                <Handle type="target" position={Position?.Top} className="!bg-pink-600" />
                <Handle type="source" position={Position?.Bottom} className="!bg-pink-600" />
              </>
            )}
          </div>
        );

        const ActionNode = ({ data }: { data: any }) => (
          <div className="px-4 py-3 bg-orange-500 text-white rounded-lg shadow-lg min-w-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <FiZap />
              <span className="font-semibold">액션</span>
            </div>
            <div className="text-xs bg-white/20 rounded p-2">
              {data.actionType === 'redirect' && '🔗 리다이렉트'}
              {data.actionType === 'variable' && '📝 변수 설정'}
              {data.actionType === 'api' && '🌐 API 호출'}
            </div>
            {Handle && (
              <>
                <Handle type="target" position={Position?.Top} className="!bg-orange-600" />
                <Handle type="source" position={Position?.Bottom} className="!bg-orange-600" />
              </>
            )}
          </div>
        );

        const EndNode = ({ data }: { data: any }) => (
          <div className="px-4 py-3 bg-red-500 text-white rounded-lg shadow-lg min-w-[150px] text-center font-semibold">
            <div className="flex items-center justify-center gap-2">
              <FiCheckCircle />
              <span>종료</span>
            </div>
            {Handle && <Handle type="target" position={Position?.Top} className="!bg-red-600" />}
          </div>
        );

        const nodeTypesObj: NodeTypes = {
          start: StartNode,
          text: TextNode,
          question: QuestionNode,
          condition: ConditionNode,
          ai: AINode,
          action: ActionNode,
          end: EndNode,
        };

        // React Flow가 완전히 로드된 후에만 상태 업데이트
        // D3-zoom이 완전히 초기화되도록 충분한 지연 시간을 둠
        // requestAnimationFrame을 사용하여 브라우저가 완전히 준비된 후에 렌더링
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setNodeTypes(nodeTypesObj);
            setIsMounted(true);
          });
        });
      } catch (error) {
        console.error('Failed to load React Flow:', error);
      }
    };

    loadReactFlow();
  }, []);

  // React Flow hooks는 항상 호출되어야 함 (조건부 렌더링 전에)
  // React Flow가 로드되기 전에도 기본 상태로 초기화
  const [localNodes, setLocalNodes] = useState<Node[]>(initialNodes);
  const [localEdges, setLocalEdges] = useState<Edge[]>(initialEdges);

  // React Flow가 로드되면 실제 hooks를 사용하여 상태 관리
  useEffect(() => {
    if (isMounted && useNodesState && useEdgesState) {
      // 실제 React Flow hooks를 사용하여 상태 관리
      // 하지만 hooks는 useEffect 내에서 호출할 수 없으므로, 
      // 대신 일반 useState를 사용하여 상태를 관리하고
      // React Flow의 변경 핸들러를 직접 구현
      // 이 부분은 실제 React Flow가 로드된 후에만 작동
    }
  }, [isMounted, useNodesState, useEdgesState]);

  // React Flow의 변경 핸들러 직접 구현
  const handleNodesChange = useCallback((changes: any) => {
    setLocalNodes((nds) => {
      const updated = [...nds];
      changes.forEach((change: any) => {
        if (change.type === 'position' && change.position) {
          const node = updated.find((n) => n.id === change.id);
          if (node) {
            node.position = change.position;
          }
        } else if (change.type === 'remove') {
          const index = updated.findIndex((n) => n.id === change.id);
          if (index !== -1) {
            updated.splice(index, 1);
          }
        } else if (change.type === 'select') {
          const node = updated.find((n) => n.id === change.id);
          if (node) {
            node.selected = change.selected;
          }
        }
      });
      return updated;
    });
  }, []);

  const handleEdgesChange = useCallback((changes: any) => {
    setLocalEdges((eds) => {
      const updated = [...eds];
      changes.forEach((change: any) => {
        if (change.type === 'remove') {
          const index = updated.findIndex((e) => e.id === change.id);
          if (index !== -1) {
            updated.splice(index, 1);
          }
        } else if (change.type === 'select') {
          const edge = updated.find((e) => e.id === change.id);
          if (edge) {
            edge.selected = change.selected;
          }
        }
      });
      return updated;
    });
  }, []);

  // 외부 상태와 동기화 (모든 hooks는 조건부 렌더링 전에 호출되어야 함)
  useEffect(() => {
    if (isMounted) {
      setNodesExternal(localNodes);
    }
  }, [localNodes, setNodesExternal, isMounted]);

  useEffect(() => {
    if (isMounted) {
      setEdgesExternal(localEdges);
    }
  }, [localEdges, setEdgesExternal, isMounted]);

  // 외부에서 nodes가 변경되면 내부 상태 업데이트
  useEffect(() => {
    if (prevInitialNodesRef.current !== initialNodes && isMounted) {
      setLocalNodes(initialNodes);
      prevInitialNodesRef.current = initialNodes;
    }
  }, [initialNodes, isMounted]);

  useEffect(() => {
    if (prevInitialEdgesRef.current !== initialEdges && isMounted) {
      setLocalEdges(initialEdges);
      prevInitialEdgesRef.current = initialEdges;
    }
  }, [initialEdges, isMounted]);

  // 엣지 연결 핸들러
  const handleConnect = useCallback(
    (params: Connection) => {
      if (addEdge) {
        setLocalEdges((eds) => addEdge(params, eds));
        onConnect(params);
      }
    },
    [onConnect, addEdge]
  );

  // nodeTypes를 useMemo로 메모이제이션하여 매번 새로 생성되지 않도록 함 (조건부 렌더링 전에 호출)
  const memoizedNodeTypes = useMemo(() => {
    if (!nodeTypes) return null;
    return nodeTypes;
  }, [nodeTypes]);

  // React Flow가 로드되기 전에는 로딩 화면 표시 (모든 hooks 호출 후)
  if (!isMounted || !ReactFlow || !ReactFlowProvider || !memoizedNodeTypes) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">플로우 에디터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // React Flow 컴포넌트 렌더링
  return (
    <ReactFlowProvider>
      <ReactFlow
        nodes={localNodes}
        edges={localEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={memoizedNodeTypes}
        fitView={localNodes.length > 0}
        className="bg-gray-50"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
        preventScrolling={false}
      >
        {Background && <Background />}
        {Controls && <Controls />}
        {MiniMap && <MiniMap />}
      </ReactFlow>
    </ReactFlowProvider>
  );
}

