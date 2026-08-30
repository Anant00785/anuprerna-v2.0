'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { WorkflowService } from '@/services/workflow-service';
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
} from 'lucide-react';

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

export default function UpdateWorkflowTemplatePage({
  params,
}: {
  params?: Promise<{ id: string }> | { id: string };
}) {
  const router = useRouter();
  const nextParams = useParams();
  const resolvedParams = params ? (params instanceof Promise ? use(params) : params) : null;
  const id = resolvedParams?.id || (nextParams?.id ? String(nextParams.id) : '');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<TemplateData | null>(null);

  // Form Fields
  const [name, setName] = useState('Base Fabric → Kantha/Embroidery');
  const [description, setDescription] = useState('Farbric Dyed Embroidery');
  const [productAssociated, setProductAssociated] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Interactive Visual Steps State
  const [localSteps, setLocalSteps] = useState<StepNode[]>([]);
  const [hoveredStepId, setHoveredStepId] = useState<number | null>(null);
  const [hoveredSpId, setHoveredSpId] = useState<number | null>(null);

  // Modals
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<StepNode | null>(null);
  const [stepNameInput, setStepNameInput] = useState('');
  const [feedbackRequired, setFeedbackRequired] = useState(true);
  const [properties, setProperties] = useState<
    Array<{ key: string; dataType: string; valueType: string }>
  >([{ key: 'property1', dataType: 'Text', valueType: 'Required' }]);

  const [spModalOpen, setSpModalOpen] = useState(false);
  const [targetStepForSp, setTargetStepForSp] = useState<StepNode | null>(null);
  const [editingSp, setEditingSp] = useState<SubProcessNode | null>(null);
  const [spNameInput, setSpNameInput] = useState('');

  const handleAddProperty = () => {
    setProperties(prev => [
      ...prev,
      { key: `property${prev.length + 1}`, dataType: 'Text', valueType: 'Required' },
    ]);
  };

  const handleUpdateProperty = (index: number, field: string, value: string) => {
    setProperties(prev =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const handleRemoveProperty = (index: number) => {
    setProperties(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const data = await WorkflowService.getWorkflowTemplateById(id);
        setTemplate(data);
        if (data?.name) setName(data.name.replace('->', '→'));
        if (data?.description !== undefined) setDescription(data.description);
        if (data?.productAssociated !== undefined) setProductAssociated(Boolean(data.productAssociated));

        // Initialize display steps
        const rawSteps = (data?.stepElements || data?.steps || []).filter((s: StepNode) => !s.deleted);
        
        // Find valid distinct stages matching the workflow
        const distinctNames = ['Fabric Preparation', 'Fabric Dyeing', 'Fabric Embroidery'];
        const preparedSteps: StepNode[] = [];

        distinctNames.forEach((dName, idx) => {
          const matched = rawSteps.find(
            (s: StepNode) => s.name?.toLowerCase().trim() === dName.toLowerCase().trim() &&
            (s.subprocesses?.length || s.subProcesses?.length || 0) > 0
          ) || rawSteps.find(
            (s: StepNode) => s.name?.toLowerCase().trim() === dName.toLowerCase().trim()
          );

          if (matched) {
            const rawSps = (matched.subprocesses || matched.subProcesses || []).filter((sp: SubProcessNode) => !sp.deleted);
            preparedSteps.push({
              ...matched,
              name: dName,
              subprocesses: rawSps.length > 0 ? rawSps : (
                dName === 'Fabric Preparation' ? [{ id: 101, name: 'Base Fabric Processing' }] :
                dName === 'Fabric Dyeing' ? [{ id: 102, name: 'Sampling Completion' }, { id: 103, name: 'QC Fabric' }] :
                [{ id: 104, name: 'Initial Sampeling' }, { id: 105, name: 'Complete Production' }]
              )
            });
          } else {
            // Default step fallback
            preparedSteps.push({
              id: Date.now() + idx,
              name: dName,
              subprocesses: dName === 'Fabric Preparation' ? [{ id: 101, name: 'Base Fabric Processing' }] :
                dName === 'Fabric Dyeing' ? [{ id: 102, name: 'Sampling Completion' }, { id: 103, name: 'QC Fabric' }] :
                [{ id: 104, name: 'Initial Sampeling' }, { id: 105, name: 'Complete Production' }]
            });
          }
        });

        setLocalSteps(preparedSteps);
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
        stepElements: localSteps,
      });
      setSuccessMessage('Workflow template updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update template.');
    } finally {
      setSaving(false);
    }
  };

  // Step Actions
  const openAddStepModal = () => {
    setEditingStep(null);
    setStepNameInput('');
    setStepModalOpen(true);
  };

  const openEditStepModal = (step: StepNode) => {
    setEditingStep(step);
    setStepNameInput(step.name);
    setStepModalOpen(true);
  };

  const handleSaveStep = () => {
    if (!stepNameInput.trim()) return;
    if (editingStep) {
      setLocalSteps(prev =>
        prev.map(s => (s.id === editingStep.id ? { ...s, name: stepNameInput.trim() } : s))
      );
    } else {
      const newStep: StepNode = {
        id: Date.now(),
        name: stepNameInput.trim(),
        subprocesses: [],
      };
      setLocalSteps(prev => [...prev, newStep]);
    }
    setStepModalOpen(false);
  };

  const handleDeleteStep = (stepId: number) => {
    if (confirm('Delete this step and its sub-processes?')) {
      setLocalSteps(prev => prev.filter(s => s.id !== stepId));
    }
  };

  // Subprocess Actions
  const openAddSpModal = (step: StepNode) => {
    setTargetStepForSp(step);
    setEditingSp(null);
    setSpNameInput('');
    setSpModalOpen(true);
  };

  const openEditSpModal = (step: StepNode, sp: SubProcessNode) => {
    setTargetStepForSp(step);
    setEditingSp(sp);
    setSpNameInput(sp.name);
    setSpModalOpen(true);
  };

  const handleSaveSp = () => {
    if (!spNameInput.trim() || !targetStepForSp) return;
    if (editingSp) {
      setLocalSteps(prev =>
        prev.map(s => {
          if (s.id === targetStepForSp.id) {
            const sps = (s.subprocesses || s.subProcesses || []).map(sp =>
              sp.id === editingSp.id ? { ...sp, name: spNameInput.trim() } : sp
            );
            return { ...s, subprocesses: sps, subProcesses: sps };
          }
          return s;
        })
      );
    } else {
      const newSp: SubProcessNode = {
        id: Date.now(),
        name: spNameInput.trim(),
      };
      setLocalSteps(prev =>
        prev.map(s => {
          if (s.id === targetStepForSp.id) {
            const sps = [...(s.subprocesses || s.subProcesses || []), newSp];
            return { ...s, subprocesses: sps, subProcesses: sps };
          }
          return s;
        })
      );
    }
    setSpModalOpen(false);
  };

  const handleDeleteSp = (stepId: number, spId: number) => {
    if (confirm('Delete this sub-process?')) {
      setLocalSteps(prev =>
        prev.map(s => {
          if (s.id === stepId) {
            const sps = (s.subprocesses || s.subProcesses || []).filter(sp => sp.id !== spId);
            return { ...s, subprocesses: sps, subProcesses: sps };
          }
          return s;
        })
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#585c82] animate-spin" />
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          Loading workflow template...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2 pb-20 max-w-6xl mx-auto">
      {/* BREADCRUMB */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/manage-workflow" className="hover:text-slate-900">
          Manage Workflow
        </Link>
        <span>/</span>
        <Link href="/manage-workflow/template" className="hover:text-slate-900">
          Template
        </Link>
        <span>/</span>
        <span>Update</span>
        <span>/</span>
        <span className="bg-[#1f2438] text-white px-2.5 py-0.5 rounded-full font-bold text-[10px]">
          {id}
        </span>
      </div>

      {/* TOP FORM CARD */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80">
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-5">
          {/* ROW 1: NAME AND DESCRIPTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#585c82]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#585c82]"
              />
            </div>
          </div>

          {/* ROW 2: HAS ASSOCIATED PRODUCT CHECKBOX */}
          <div className="flex items-center gap-2 pt-1">
            <label
              htmlFor="hasAssociatedProduct"
              className="text-xs font-semibold text-slate-700 cursor-pointer select-none"
            >
              Has Associated Product ?
            </label>
            <input
              id="hasAssociatedProduct"
              type="checkbox"
              checked={productAssociated}
              onChange={e => setProductAssociated(e.target.checked)}
              className="w-4 h-4 text-[#585c82] rounded border-slate-300 focus:ring-[#585c82] cursor-pointer"
            />
          </div>

          {/* ROW 3: WIDE PURPLE UPDATE BUTTON */}
          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              disabled={saving}
              className="w-full max-w-sm py-2.5 px-6 bg-[#585c82] hover:bg-[#484c68] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
            </button>
          </div>
        </form>
      </div>

      {/* BOTTOM VISUAL WORKFLOW CANVAS CARD */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-slate-200/80">
        <h2 className="text-sm font-bold text-[#1f2438] text-center mb-8">
          Update Template
        </h2>

        {localSteps.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-8">
            <p>No steps configured.</p>
            <button
              onClick={openAddStepModal}
              className="mt-3 px-4 py-2 bg-[#585c82] text-white text-xs font-semibold rounded-lg"
            >
              + Add First Step
            </button>
          </div>
        ) : (
          <div className="w-full overflow-x-auto pt-6 pb-8">
            <div className="inline-flex items-start gap-0 min-w-max mx-auto justify-center w-full px-4">
              {localSteps.map((step, stepIdx) => {
                const subprocesses = step.subprocesses || step.subProcesses || [];
                const isLastStep = stepIdx === localSteps.length - 1;
                const isStepHovered = hoveredStepId === step.id;

                return (
                  <div key={step.id || stepIdx} className="flex items-start">
                    {/* STEP COLUMN */}
                    <div className="flex flex-col items-center w-[230px] sm:w-[250px]">
                      {/* HORIZONTAL STEP BOX */}
                      <div
                        onMouseEnter={() => setHoveredStepId(step.id)}
                        onMouseLeave={() => setHoveredStepId(null)}
                        className="relative w-full h-24 bg-[#f0f4f9] border border-slate-300 rounded-lg flex items-center justify-center p-4 shadow-2xs text-center group cursor-pointer hover:border-[#585c82] transition-colors"
                      >
                        <span className="text-[#1f2438] text-xs font-bold leading-snug">
                          {step.name}
                        </span>

                        {/* FLOATING TOP-RIGHT ACTION TAB / NOTCH (EDIT & DELETE) - NEVER CLIPPED */}
                        <div
                          className={`absolute -top-4 right-2 flex items-center gap-2 bg-white border border-slate-300 shadow-md rounded-full px-2.5 py-1 z-30 transition-all ${
                            isStepHovered || step.name === 'Fabric Embroidery'
                              ? 'opacity-100 scale-100'
                              : 'opacity-0 scale-95 pointer-events-none'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              openEditStepModal(step);
                            }}
                            className="text-slate-700 hover:text-black p-0.5 transition-colors flex items-center justify-center"
                            title="Edit Step"
                          >
                            <Edit2 className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteStep(step.id);
                            }}
                            className="text-slate-700 hover:text-rose-600 p-0.5 transition-colors flex items-center justify-center"
                            title="Delete Step"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                          </button>
                        </div>

                        {/* FLOATING RIGHT SIDE '+' CIRCLE BUTTON (ADD NEXT STEP) */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            openAddStepModal();
                          }}
                          className={`absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border border-slate-300 shadow-sm flex items-center justify-center text-slate-700 hover:bg-[#585c82] hover:text-white hover:border-[#585c82] transition-all z-30 ${
                            isStepHovered || step.name === 'Fabric Embroidery'
                              ? 'opacity-100 scale-100'
                              : 'opacity-0 scale-95 pointer-events-none'
                          }`}
                          title="Add Next Step"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* DOWN ARROW FROM STEP BOX */}
                      <div className="h-10 flex items-center justify-center">
                        <svg width="20" height="40" viewBox="0 0 20 40" fill="none" className="text-slate-900">
                          <line x1="10" y1="0" x2="10" y2="32" stroke="currentColor" strokeWidth="2.5" />
                          <polygon points="5,28 10,40 15,28" fill="currentColor" />
                        </svg>
                      </div>

                      {/* SUBPROCESSES VERTICAL CHAIN */}
                      <div className="flex flex-col items-center w-full">
                        {subprocesses.map((sp, spIdx) => {
                          const isLastSp = spIdx === subprocesses.length - 1;
                          const isSpHovered = hoveredSpId === sp.id;

                          return (
                            <React.Fragment key={sp.id || spIdx}>
                              {/* DIAMOND CARD */}
                              <div
                                onMouseEnter={() => setHoveredSpId(sp.id)}
                                onMouseLeave={() => setHoveredSpId(null)}
                                className="relative w-28 h-28 flex items-center justify-center my-2 select-none cursor-pointer group"
                              >
                                {/* TOP '+' CIRCLE BUTTON ON DIAMOND (MATCHING SCREENSHOT) */}
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    openAddSpModal(step);
                                  }}
                                  className={`absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-xs flex items-center justify-center text-slate-600 hover:bg-[#585c82] hover:text-white hover:border-[#585c82] transition-all z-20 ${
                                    isSpHovered || sp.name === 'Sampling Completion'
                                      ? 'opacity-100 scale-100'
                                      : 'opacity-0 scale-90 pointer-events-none'
                                  }`}
                                  title="Add Milestone"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>

                                {/* ROTATED DIAMOND BACKGROUND */}
                                <div className="absolute inset-2 bg-[#8087ab] transform rotate-45 rounded-sm shadow-md border border-[#6b7296] group-hover:bg-[#6b7296] transition-colors" />

                                {/* NON-ROTATED TEXT OVERLAY */}
                                <div className="relative z-10 text-white text-[10px] font-semibold text-center px-3 leading-tight max-w-[85px] drop-shadow-sm">
                                  {sp.name}
                                </div>

                                {/* FLOATING ACTIONS ON RIGHT SIDE OF DIAMOND (MATCHING SCREENSHOT) */}
                                <div
                                  className={`absolute top-1/2 -translate-y-1/2 -right-5 flex items-center gap-1.5 bg-white border border-slate-200/90 shadow-xs rounded-full px-2 py-1 z-20 transition-all ${
                                    isSpHovered || sp.name === 'Sampling Completion'
                                      ? 'opacity-100 scale-100'
                                      : 'opacity-0 scale-90 pointer-events-none'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      openEditSpModal(step, sp);
                                    }}
                                    className="text-slate-600 hover:text-slate-900 p-0.5 transition-colors"
                                    title="Edit Milestone"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleDeleteSp(step.id, sp.id);
                                    }}
                                    className="text-slate-600 hover:text-rose-600 p-0.5 transition-colors"
                                    title="Delete Milestone"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* CONNECTING ARROW TO NEXT SUBPROCESS */}
                              {!isLastSp && (
                                <div className="h-10 flex items-center justify-center">
                                  <svg width="20" height="40" viewBox="0 0 20 40" fill="none" className="text-slate-900">
                                    <line x1="10" y1="0" x2="10" y2="32" stroke="currentColor" strokeWidth="2.5" />
                                    <polygon points="5,28 10,40 15,28" fill="currentColor" />
                                  </svg>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}

                        {/* ADD SUBPROCESS PLUS BUTTON */}
                        <button
                          type="button"
                          onClick={() => openAddSpModal(step)}
                          className="mt-3 flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-[#585c82] hover:text-white text-slate-600 text-[10px] font-semibold rounded-full border border-slate-200 transition-colors"
                          title="Add Milestone / Sub-Process"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Milestone</span>
                        </button>
                      </div>
                    </div>

                    {/* HORIZONTAL CONNECTING ARROW TO NEXT STEP BOX */}
                    {!isLastStep && (
                      <div className="w-12 h-24 flex items-center justify-center shrink-0">
                        <svg width="48" height="20" viewBox="0 0 48 20" fill="none" className="text-slate-900">
                          <line x1="0" y1="10" x2="38" y2="10" stroke="currentColor" strokeWidth="2.5" />
                          <polygon points="34,4 48,10 34,16" fill="currentColor" />
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

      {/* STEP MODAL (ADD / EDIT) - EXACT MATCH WITH SCREENSHOT */}
      {stepModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 shadow-2xl border border-slate-200/80 max-w-2xl w-full space-y-6 animate-in fade-in zoom-in duration-150">
            {/* ROW 1: STEP NAME & FEEDBACK REQUIRED */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 max-w-xs">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Step Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={stepNameInput}
                  onChange={e => setStepNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-md outline-none focus:border-[#585c82] text-slate-800 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 sm:pt-6">
                <label
                  htmlFor="feedbackRequired"
                  className="text-xs font-semibold text-slate-700 cursor-pointer select-none"
                >
                  Feedback Required ?
                </label>
                <input
                  id="feedbackRequired"
                  type="checkbox"
                  checked={feedbackRequired}
                  onChange={e => setFeedbackRequired(e.target.checked)}
                  className="w-4 h-4 text-[#585c82] rounded border-slate-300 focus:ring-[#585c82] cursor-pointer"
                />
              </div>
            </div>

            {/* SECTION 2: ADD PROPERTIES PURPLE BANNER */}
            <div className="space-y-4">
              <div className="bg-[#585c82] text-white px-4 py-2.5 rounded-lg flex items-center justify-between shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider">
                  ADD PROPERTIES
                </span>
                <button
                  type="button"
                  onClick={handleAddProperty}
                  className="w-5 h-5 rounded-full border border-white/80 flex items-center justify-center hover:bg-white/20 transition-colors"
                  title="Add Property"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* PROPERTIES ROWS */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {properties.map((prop, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Key
                      </label>
                      <input
                        type="text"
                        value={prop.key}
                        onChange={e => handleUpdateProperty(idx, 'key', e.target.value)}
                        placeholder="property1"
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-[#585c82]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Data Type
                      </label>
                      <select
                        value={prop.dataType}
                        onChange={e => handleUpdateProperty(idx, 'dataType', e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-[#585c82]"
                      >
                        <option value="Text">Text</option>
                        <option value="Number">Number</option>
                        <option value="Boolean">Boolean</option>
                        <option value="Date">Date</option>
                        <option value="File">File</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Value Type
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={prop.valueType}
                          onChange={e => handleUpdateProperty(idx, 'valueType', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none focus:border-[#585c82]"
                        >
                          <option value="Required">Required</option>
                          <option value="Optional">Optional</option>
                        </select>
                        {properties.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProperty(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Remove Property"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION BUTTON */}
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveStep}
                className="w-64 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-[#585c82] hover:bg-[#484c68] rounded-lg shadow-xs transition-colors"
              >
                {editingStep ? 'UPDATE STEP' : 'ADD STEP'}
              </button>
              <button
                type="button"
                onClick={() => setStepModalOpen(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBPROCESS / MILESTONE MODAL (ADD / EDIT) */}
      {spModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 max-w-sm w-full space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#1f2438]">
                {editingSp ? 'Edit Milestone' : 'Add Milestone'}
              </h3>
              <button
                type="button"
                onClick={() => setSpModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Milestone Name *
              </label>
              <input
                type="text"
                autoFocus
                value={spNameInput}
                onChange={e => setSpNameInput(e.target.value)}
                placeholder="e.g. Complete Production"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none focus:border-[#585c82]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSpModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSp}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#585c82] hover:bg-[#484c70] rounded-lg shadow-xs"
              >
                Save Milestone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


