'use client';

import React, { useEffect, useState, use } from 'react';
import { useParams } from 'next/navigation';
import { WorkflowService } from '@/services/workflow-service';
import { Loader2 } from 'lucide-react';

interface SubProcessNode {
  id: number;
  name: string;
  estimatedDays?: number;
  primarySubProcess?: boolean;
  primarySubprocess?: boolean;
  parentSubProcessId?: string;
  previousSubProcessId?: string;
  nextSubProcessId?: string;
  deleted?: boolean;
  element?: { elementId?: string };
}

interface StepNode {
  id: number;
  name: string;
  estimatedDays?: number;
  primaryStep?: boolean;
  parentStepId?: string;
  nextStepId?: string;
  previousStepId?: string;
  deleted?: boolean;
  element?: { elementId?: string; posX?: number; posY?: number };
  subProcesses?: SubProcessNode[];
  subprocesses?: SubProcessNode[];
}

interface TemplateData {
  id: number;
  name: string;
  description?: string;
  steps?: StepNode[];
  stepElements?: StepNode[];
}

export default function ViewWorkflowTemplatePage({ params }: { params?: Promise<{ id: string }> | { id: string } }) {
  const nextParams = useParams();
  const resolvedParams = params ? (params instanceof Promise ? use(params) : params) : null;
  const id = resolvedParams?.id || (nextParams?.id ? String(nextParams.id) : '');

  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const data = await WorkflowService.getWorkflowTemplateById(id);
        setTemplate(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load workflow template details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  // Sort and order steps horizontally
  const steps: StepNode[] = React.useMemo(() => {
    const rawSteps = template?.steps || template?.stepElements || [];
    if (!rawSteps || rawSteps.length === 0) return [];
    const active = rawSteps.filter((s) => !s.deleted);
    if (active.length <= 1) return active;

    // Build chain based on previousStepId / nextStepId
    const stepMap = new Map<string, StepNode>();
    active.forEach((s) => {
      const elementId = s.element?.elementId || String(s.id);
      stepMap.set(elementId, s);
    });

    // Find root (step with no previousStepId or previousStepId not in active)
    let current = active.find(
      (s) => (!s.previousStepId && !s.parentStepId) || !stepMap.has(s.previousStepId || '')
    );
    if (!current) current = active[0];

    const ordered: StepNode[] = [];
    const visited = new Set<number>();

    while (current && !visited.has(current.id)) {
      ordered.push(current);
      visited.add(current.id);
      if (current.nextStepId && stepMap.has(current.nextStepId)) {
        current = stepMap.get(current.nextStepId)!;
      } else {
        break;
      }
    }

    // Append any unvisited remaining steps
    active.forEach((s) => {
      if (!visited.has(s.id)) ordered.push(s);
    });

    return ordered;
  }, [template]);

  // Order subprocesses vertically for each step
  const getOrderedSubprocesses = (step: StepNode): SubProcessNode[] => {
    const rawSubprocesses = step.subProcesses || step.subprocesses || [];
    if (!rawSubprocesses || rawSubprocesses.length === 0) return [];
    const active = rawSubprocesses.filter((sp) => !sp.deleted);
    if (active.length <= 1) return active;

    const spMap = new Map<string, SubProcessNode>();
    active.forEach((sp) => {
      const elId = sp.element?.elementId || String(sp.id);
      spMap.set(elId, sp);
    });

    let current = active.find(
      (sp) =>
        (!sp.previousSubProcessId && !sp.parentSubProcessId) ||
        sp.primarySubProcess ||
        sp.primarySubprocess
    );
    if (!current && active.length > 0) current = active[0];

    const ordered: SubProcessNode[] = [];
    const visited = new Set<number>();

    while (current && !visited.has(current.id)) {
      ordered.push(current);
      visited.add(current.id);
      if (current.nextSubProcessId && spMap.has(current.nextSubProcessId)) {
        current = spMap.get(current.nextSubProcessId)!;
      } else {
        break;
      }
    }

    active.forEach((sp) => {
      if (!visited.has(sp.id)) ordered.push(sp);
    });

    return ordered;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#585c82] animate-spin" />
        <p className="text-xs text-slate-500 font-light tracking-wide uppercase">
          Loading workflow diagram...
        </p>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-red-100 text-red-700">
        <h3 className="font-bold text-base mb-1">Unable to display workflow template</h3>
        <p className="text-sm">{error || 'Template record not found.'}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pt-6 pb-20 px-4 min-h-[85vh]">
      {/* Workflow Tree Container */}
      <div className="inline-flex items-start gap-0 min-w-max pb-12">
        {steps.map((step, stepIdx) => {
          const subprocesses = getOrderedSubprocesses(step);
          const isLastStep = stepIdx === steps.length - 1;

          return (
            <div key={step.id || stepIdx} className="flex items-start">
              {/* Step Column */}
              <div className="flex flex-col items-center w-[260px] sm:w-[280px]">
                {/* Horizontal Step Box */}
                <div className="w-full h-24 bg-[#f0f4f9] border-2 border-[#2b2d42] rounded-sm flex items-center justify-center p-4 shadow-sm text-center">
                  <span className="text-[#2b2d42] text-sm font-semibold tracking-tight leading-snug">
                    {step.name}
                  </span>
                </div>

                {/* Subprocesses Vertical Chain */}
                {subprocesses.length > 0 && (
                  <div className="flex flex-col items-center w-full mt-1">
                    {/* Top Down Arrow from Step Box */}
                    <div className="h-10 flex items-center justify-center">
                      <svg width="20" height="40" viewBox="0 0 20 40" fill="none" className="text-[#2b2d42]">
                        <line x1="10" y1="0" x2="10" y2="34" stroke="currentColor" strokeWidth="2.5" />
                        <polygon points="4,30 10,40 16,30" fill="currentColor" />
                      </svg>
                    </div>

                    {/* Subprocesses Diamonds */}
                    {subprocesses.map((sp, spIdx) => {
                      const isLastSp = spIdx === subprocesses.length - 1;

                      return (
                        <React.Fragment key={sp.id || spIdx}>
                          {/* Diamond Card */}
                          <div className="relative w-28 h-28 flex items-center justify-center my-1 select-none">
                            {/* Rotated Diamond Background */}
                            <div className="absolute inset-1.5 bg-[#8085aa] transform rotate-45 rounded-sm shadow-md border border-[#6b7096]" />
                            {/* Non-rotated Text Overlay */}
                            <div className="relative z-10 text-white text-[11px] sm:text-xs font-semibold text-center px-3 leading-tight max-w-[85px] drop-shadow-sm">
                              {sp.name}
                            </div>
                          </div>

                          {/* Connecting Arrow to Next Subprocess */}
                          {!isLastSp && (
                            <div className="h-10 flex items-center justify-center">
                              <svg width="20" height="40" viewBox="0 0 20 40" fill="none" className="text-[#2b2d42]">
                                <line x1="10" y1="0" x2="10" y2="34" stroke="currentColor" strokeWidth="2.5" />
                                <polygon points="4,30 10,40 16,30" fill="currentColor" />
                              </svg>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Horizontal Connecting Arrow to Next Step Box */}
              {!isLastStep && (
                <div className="w-12 h-24 flex items-center justify-center flex-shrink-0">
                  <svg width="48" height="20" viewBox="0 0 48 20" fill="none" className="text-[#2b2d42]">
                    <line x1="0" y1="10" x2="40" y2="10" stroke="currentColor" strokeWidth="2.5" />
                    <polygon points="36,4 48,10 36,16" fill="currentColor" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


