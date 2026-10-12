"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useEdgesState,
  useNodesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WORKFLOW_NODES } from "@/lib/workflow/renewal";
import { PROCESS_STEPS, PROCESS_LANES } from "@/lib/workflow/process";
import { SCHEMA_ENTITIES } from "@/lib/data/schema";

type Tab = "process" | "workflow" | "schema";

function layout(nodes: Node[], edges: Edge[], dir: "TB" | "LR" = "LR") {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: dir, nodesep: 40, ranksep: 70 });
  nodes.forEach((n) => g.setNode(n.id, { width: 220, height: 80 }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map((n) => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: { x: pos.x - 110, y: pos.y - 40 },
    };
  });
}

function buildWorkflow(counts: Record<string, number>) {
  const nodes: Node[] = WORKFLOW_NODES.map((n) => ({
    id: n.id,
    position: { x: 0, y: 0 },
    data: {
      label: n.label,
      description: n.description,
      count: counts[n.id] || 0,
      kind: "workflow",
      meta: n,
    },
    style: {
      border: "1px solid #213368",
      borderRadius: 16,
      padding: 12,
      width: 220,
      background: "#fff",
      fontSize: 12,
    },
  }));
  const edges: Edge[] = WORKFLOW_NODES.flatMap((n) =>
    n.transitions.map((t) => ({
      id: `${n.id}-${t.to}`,
      source: n.id,
      target: t.to,
      label: t.trigger,
      style: { stroke: "#3da1ca" },
      labelStyle: { fontSize: 9, fill: "#5b6b82" },
    })),
  );
  return { nodes: layout(nodes, edges), edges };
}

function buildProcess() {
  const nodes: Node[] = PROCESS_STEPS.map((s, i) => ({
    id: s.id,
    position: { x: 0, y: 0 },
    data: {
      label: s.label,
      description: s.description,
      kind: "process",
      lane: PROCESS_LANES.find((l) => l.id === s.lane)?.label,
      assumption: s.assumption,
      meta: s,
    },
    style: {
      border: s.assumption ? "1px dashed #3da1ca" : "1px solid #213368",
      borderRadius: 16,
      padding: 12,
      width: 220,
      background: "#eaf3f8",
      fontSize: 12,
    },
  }));
  const edges: Edge[] = PROCESS_STEPS.flatMap((s) =>
    s.next.map((t) => ({
      id: `${s.id}-${t}`,
      source: s.id,
      target: t,
      style: { stroke: "#25a55e" },
    })),
  );
  return { nodes: layout(nodes, edges), edges };
}

function buildSchema() {
  const nodes: Node[] = SCHEMA_ENTITIES.map((e) => ({
    id: e.id,
    position: { x: 0, y: 0 },
    data: {
      label: e.label,
      description: e.description,
      kind: "schema",
      meta: e,
    },
    style: {
      border: "1px solid #00103e",
      borderRadius: 12,
      padding: 12,
      width: 220,
      background: "#fff",
      fontSize: 12,
    },
  }));
  const edges: Edge[] = SCHEMA_ENTITIES.flatMap((e) =>
    e.relations.map((r) => ({
      id: `${e.id}-${r.to}-${r.label}`,
      source: e.id,
      target: r.to,
      label: r.label,
      style: { stroke: "#213368" },
      labelStyle: { fontSize: 9 },
    })),
  );
  return { nodes: layout(nodes, edges, "TB"), edges };
}

function CanvasInner({
  tab,
  counts,
}: {
  tab: Tab;
  counts: Record<string, number>;
}) {
  const built = useMemo(() => {
    if (tab === "workflow") return buildWorkflow(counts);
    if (tab === "process") return buildProcess();
    return buildSchema();
  }, [tab, counts]);

  const [nodes, setNodes, onNodesChange] = useNodesState(built.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(built.edges);
  const [selected, setSelected] = useState<Node | null>(null);
  const { fitView } = useReactFlow();
  const storageKey = `tasco-wf-layout-${tab}`;

  useEffect(() => {
    setNodes(built.nodes);
    setEdges(built.edges);
    setSelected(null);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const positions = JSON.parse(saved) as Record<string, { x: number; y: number }>;
        setNodes((ns) =>
          ns.map((n) =>
            positions[n.id] ? { ...n, position: positions[n.id] } : n,
          ),
        );
      } catch {
        /* ignore */
      }
    }
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [built, setNodes, setEdges, fitView, storageKey]);

  const onNodeDragStop = useCallback(() => {
    setNodes((ns) => {
      const positions: Record<string, { x: number; y: number }> = {};
      ns.forEach((n) => {
        positions[n.id] = n.position;
      });
      localStorage.setItem(storageKey, JSON.stringify(positions));
      return ns;
    });
  }, [setNodes, storageKey]);

  const resetLayout = () => {
    localStorage.removeItem(storageKey);
    setNodes(built.nodes);
    setTimeout(() => fitView({ padding: 0.2 }), 50);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "f") fitView({ padding: 0.2 });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fitView]);

  return (
    <div className="flex h-[640px] overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes.map((n) => ({
            ...n,
            data: {
              ...n.data,
              label: (
                <div>
                  <div className="font-semibold text-tasco-deep">
                    {String(n.data.label)}
                    {tab === "workflow" ? (
                      <span className="ml-2 rounded-full bg-tasco-sky/20 px-1.5 text-[10px]">
                        {String(n.data.count ?? 0)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {String(n.data.description || "").slice(0, 80)}
                  </div>
                </div>
              ),
            },
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => setSelected(node)}
          onNodeDragStop={onNodeDragStop}
          fitView
          nodesDraggable
        >
          <Background gap={18} color="#d5deea" />
          <MiniMap pannable zoomable />
          <Controls />
          <Panel position="top-right" className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => fitView({ padding: 0.2 })}>
              Fit to view (F)
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={resetLayout}>
              Reset layout
            </Button>
          </Panel>
        </ReactFlow>
      </div>
      <aside className="w-80 shrink-0 overflow-y-auto border-l bg-tasco-pale/30 p-4">
        {selected ? (
          <Detail node={selected} tab={tab} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Click a node for details. Drag nodes to rearrange. Press F to fit.
          </p>
        )}
      </aside>
    </div>
  );
}

function Detail({ node, tab }: { node: Node; tab: Tab }) {
  const meta = node.data.meta as Record<string, unknown>;
  return (
    <div className="space-y-3 text-sm">
      <Badge tone="sky">{tab}</Badge>
      <h3 className="text-lg font-semibold text-tasco-deep">
        {String(node.data.label)}
      </h3>
      <p className="text-muted-foreground">{String(node.data.description || "")}</p>
      {tab === "workflow" && (
        <>
          <div>
            Live count: <strong>{String(node.data.count ?? 0)}</strong>
          </div>
          <div className="text-xs">
            Transitions:{" "}
            {JSON.stringify((meta as { transitions?: unknown }).transitions || [])}
          </div>
        </>
      )}
      {tab === "process" && (
        <>
          <div>Lane: {String(node.data.lane || "")}</div>
          {Boolean(node.data.assumption) && (
            <div className="rounded-lg border border-dashed border-tasco-sky/50 bg-white p-2 text-xs">
              Assumption: {String(node.data.assumption)}
            </div>
          )}
        </>
      )}
      {tab === "schema" && (
        <div className="space-y-2">
          {((meta as { fields?: { name: string; type: string; fullAccess: string[] }[] })
            .fields || []).map((f) => (
            <div key={f.name} className="rounded-lg bg-white p-2 text-xs">
              <div className="font-mono font-semibold">
                {f.name}: {f.type}
              </div>
              <div className="text-muted-foreground">
                Full access: {f.fullAccess.join(", ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkflowCanvas({ counts }: { counts: Record<string, number> }) {
  const [tab, setTab] = useState<Tab>("workflow");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["process", "workflow", "schema"] as Tab[]).map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant={tab === t ? "default" : "outline"}
            onClick={() => setTab(t)}
          >
            {t === "process" ? "Business process" : t === "workflow" ? "Workflow states" : "Data schema"}
          </Button>
        ))}
      </div>
      <ReactFlowProvider>
        <CanvasInner tab={tab} counts={counts} />
      </ReactFlowProvider>
    </div>
  );
}