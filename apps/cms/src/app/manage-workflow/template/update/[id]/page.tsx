'use client';

import React, { useEffect, useState, use } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  productAssociated?: boolean;
  steps?: StepNode[];
  stepElements?: StepNode[];
}

export default function UpdateWorkflowTemplatePage({ params }: { params?: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const nextParams = useParams();
  const resolvedParams = params ? (params instanceof Promise ? use(params) : params) : null;
  const id = resolvedParams?.id || (nextParams?.id ? String(nextParams.id) : '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<TemplateData | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [productAssociated, setProductAssociated] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const data = await WorkflowService.getWorkflowTemplateById(id);
        setTemplate(data);
        setName(data?.name || '');
        setDescription(data?.description || '');
        setProductAssociated(Boolean(data?.productAssociated));
      } catch (err: any) {
        setError(err.message || 'Failed to load workflow template details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      await WorkflowService.updateWorkflowTemplate({
        ...template,
        id: Number(id),
        name,
        description,
        productAssociated,
      });
      setSuccessMessage('Workflow template updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update template.');
    } finally {
      setSaving(false);
    }
  };

  // Sort and order steps horizontally
  const steps: StepNode[] = React.useMemo(() => {
    const rawSteps = template?.steps || template?.stepElements || [];
    if (!rawSteps || rawSteps.length === 0) return [];
    const active = rawSteps.filter((s) => !s.deleted);
    if (active.length <= 1) return active;

    const stepMap = new Map<string, StepNode>();
    active.forEach((s) => {
      const elementId = s.element?.elementId || String(s.id);
      stepMap.set(elementId, s);
    });

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
          Loading workflow template...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 pb-16">
      {/* Top Form Card */}
      <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-slate-100">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-5">
          {/* Row 1: Name and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#585c82] focus:border-[#585c82]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#585c82] focus:border-[#585c82]"
              />
            </div>
          </div>

          {/* Row 2: Has Associated Product Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <label className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
              Has Associated Product ?
            </label>
            <input
              type="checkbox"
              checked={productAssociated}
              onChange={(e) => setProductAssociated(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Row 3: Update Button */}
          <div className="pt-3 flex justify-center">
            <button
              type="submit"
              disabled={saving}
              className="w-full max-w-sm py-2.5 px-6 bg-[#585c82] hover:bg-[#484c68] text-white text-xs font-bold tracking-wider rounded-md shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
            </button>
          </div>
        </form>
      </div>

      {/* Bottom Visual Workflow Diagram Card */}
      <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-slate-100 overflow-hidden">
        <h2 className="text-base font-bold text-[#2d3142] text-center mb-8">
          Update Template
        </h2>

        {steps.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-8">
            No steps configured for this workflow template.
          </div>
        ) : (
          <div className="w-full overflow-x-auto pb-6">
            <div className="inline-flex items-start gap-0 min-w-max mx-auto justify-center w-full">
              {steps.map((step, stepIdx) => {
                const subprocesses = getOrderedSubprocesses(step);
                const isLastStep = stepIdx === steps.length - 1;

                return (
                  <div key={step.id || stepIdx} className="flex items-start">
                    {/* Step Column */}
                    <div className="flex flex-col items-center w-[240px] sm:w-[260px]">
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
        )}
      </div>
    </div>
  );
}

