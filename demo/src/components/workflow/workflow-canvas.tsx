"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
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
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import type { CaseState } from "@/lib/types";
import type { Locale } from "@/lib/i18n/locale";
import type { WorkflowTransition } from "@/lib/workflow/renewal";
import {
  laneText,
  processStepText,
  relationText,
  schemaEntityDescription,
  transitionText,
  workflowNodeText,
} from "@/lib/workflow/i18n";

type Tab = "process" | "workflow" | "schema";

export type WorkflowCanvasLabels = Dictionary["workflowCanvas"];

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

function buildWorkflow(counts: Record<string, number>, locale: Locale) {
  const nodes: Node[] = WORKFLOW_NODES.map((n) => ({
    id: n.id,
    position: { x: 0, y: 0 },
    data: {
      ...workflowNodeText(n, locale),
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
      label: transitionText(n.id, t.to, t.trigger, locale),
      style: { stroke: "#3da1ca" },
      labelStyle: { fontSize: 9, fill: "#5b6b82" },
    })),
  );
  return { nodes: layout(nodes, edges), edges };
}

function buildProcess(locale: Locale) {
  const nodes: Node[] = PROCESS_STEPS.map((s) => ({
    id: s.id,
    position: { x: 0, y: 0 },
    data: {
      ...processStepText(s, locale),
      kind: "process",
      lane: laneText(s.lane, PROCESS_LANES.find((l) => l.id === s.lane)?.label ?? s.lane, locale),
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

function buildSchema(locale: Locale) {
  const nodes: Node[] = SCHEMA_ENTITIES.map((e) => ({
    id: e.id,
    position: { x: 0, y: 0 },
    data: {
      label: e.label,
      description: schemaEntityDescription(e, locale),
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
      label: relationText(r.label, locale),
      style: { stroke: "#213368" },
      labelStyle: { fontSize: 9 },
    })),
  );
  return { nodes: layout(nodes, edges, "TB"), edges };
}

const subscribeNever = () => () => {};

function withSavedLayout(nodes: Node[], storageKey: string): Node[] {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return nodes;
    const positions = JSON.parse(saved) as Record<string, { x: number; y: number }>;
    return nodes.map((n) => (positions[n.id] ? { ...n, position: positions[n.id] } : n));
  } catch {
    return nodes;
  }
}

function CanvasInner({
  tab,
  counts,
  labels,
  locale,
}: {
  tab: Tab;
  counts: Record<string, number>;
  labels: WorkflowCanvasLabels;
  locale: Locale;
}) {
  const built = useMemo(() => {
    if (tab === "workflow") return buildWorkflow(counts, locale);
    if (tab === "process") return buildProcess(locale);
    return buildSchema(locale);
  }, [tab, counts, locale]);

  const storageKey = `tasco-wf-layout-${tab}`;
  // Saved positions live in localStorage, so apply them only after hydration
  // (server and first client render must match).
  const isClient = useSyncExternalStore(subscribeNever, () => true, () => false);
  const initialNodes = useMemo(
    () => (isClient ? withSavedLayout(built.nodes, storageKey) : built.nodes),
    [built, isClient, storageKey],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(built.edges);
  const [selected, setSelected] = useState<Node | null>(null);
  const { fitView } = useReactFlow();

  // New map (tab, counts, locale) or saved layout now readable: start from it.
  const [shownNodes, setShownNodes] = useState(initialNodes);
  if (shownNodes !== initialNodes) {
    setShownNodes(initialNodes);
    setNodes(initialNodes);
    setEdges(built.edges);
    setSelected(null);
  }

  useEffect(() => {
    const id = window.setTimeout(() => fitView({ padding: 0.2 }), 50);
    return () => window.clearTimeout(id);
  }, [initialNodes, fitView]);

  const onNodeDragStop = useCallback(() => {
    const positions = Object.fromEntries(nodes.map((n) => [n.id, n.position]));
    localStorage.setItem(storageKey, JSON.stringify(positions));
  }, [nodes, storageKey]);

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
                  <div className="font-semibold text-tasco-ink">
                    {String(n.data.label)}
                    {tab === "workflow" ? (
                      <span className="ml-2 rounded-full bg-tasco-lime/20 px-1.5 text-[10px]">
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
          // The rendered node's label is JSX; keep the state node so Detail gets the plain label.
          onNodeClick={(_, node) => setSelected(nodes.find((n) => n.id === node.id) ?? node)}
          onNodeDragStop={onNodeDragStop}
          fitView
          nodesDraggable
        >
          <Background gap={18} color="#d5deea" />
          <MiniMap pannable zoomable />
          <Controls />
          <Panel position="top-right" className="flex gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => fitView({ padding: 0.2 })}>
              {labels.fitView}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={resetLayout}>
              {labels.resetLayout}
            </Button>
          </Panel>
        </ReactFlow>
      </div>
      <aside className="w-80 shrink-0 overflow-y-auto border-l bg-tasco-mist/30 p-4">
        {selected ? (
          <Detail node={selected} tab={tab} labels={labels} locale={locale} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {labels.hint}
          </p>
        )}
      </aside>
    </div>
  );
}

function Detail({
  node,
  tab,
  labels,
  locale,
}: {
  node: Node;
  tab: Tab;
  labels: WorkflowCanvasLabels;
  locale: Locale;
}) {
  const meta = node.data.meta as Record<string, unknown>;
  return (
    <div className="space-y-3 text-sm">
      <Badge tone="sky">{labels.tabs[tab]}</Badge>
      <h3 className="text-lg font-semibold text-tasco-ink">
        {String(node.data.label)}
      </h3>
      <p className="text-muted-foreground">{String(node.data.description || "")}</p>
      {tab === "workflow" && (
        <>
          <div>
            {labels.liveCount}: <strong>{String(node.data.count ?? 0)}</strong>
          </div>
          <div className="text-xs">
            <div className="font-semibold">{labels.transitions}:</div>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {((meta as { transitions?: WorkflowTransition[] }).transitions || []).map((t) => (
                <li key={t.to}>
                  {getDictionary(locale).caseStates[t.to]}:{" "}
                  {transitionText(node.id as CaseState, t.to, t.trigger, locale)}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      {tab === "process" && (
        <>
          <div>
            {labels.lane}: {String(node.data.lane || "")}
          </div>
          {Boolean(node.data.assumption) && (
            <div className="rounded-lg border border-dashed border-tasco-lime/50 bg-white p-2 text-xs">
              {labels.assumption}: {String(node.data.assumption)}
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
                {labels.fullAccess}: {f.fullAccess.join(", ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkflowCanvas({
  counts,
  labels,
  locale,
}: {
  counts: Record<string, number>;
  labels: WorkflowCanvasLabels;
  locale: Locale;
}) {
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
            {labels.tabs[t]}
          </Button>
        ))}
      </div>
      <ReactFlowProvider>
        <CanvasInner tab={tab} counts={counts} labels={labels} locale={locale} />
      </ReactFlowProvider>
    </div>
  );
}