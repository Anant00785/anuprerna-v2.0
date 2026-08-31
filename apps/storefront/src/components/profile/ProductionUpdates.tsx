'use client';
import { useState } from 'react';

// Production Updates timeline — ports the live Angular
// custom-order-item-process-overview + process-status components.
// Renders the ordered step stepper (check / hourglass / % progress), a status pill
// (Dispatched / In-Progress / Ready-To-Dispatch), and a "See all updates"
// expander that reveals each step's progress bar + its sub-processes.

export interface WorkflowSubprocess {
  subProcessId?: number;
  subProcessName?: string;
  subProcessStatus?: string; // COMPLETED | IN_PROGRESS | PENDING | HALTED
  subProcessElementId?: string;
  previousSubProcessElementId?: string;
  nextSubProcessElementId?: string;
}

export interface WorkflowStep {
  stepId?: number;
  stepName?: string;
  stepStatus?: string; // COMPLETED | IN_PROGRESS | PENDING | HALTED
  stepElementId?: string;
  previousStepElementId?: string;
  nextStepElementId?: string;
  subProcesses?: WorkflowSubprocess[];
  stepProgress?: number;
}

export interface OrderwiseWorkflow {
  workflowId?: number;
  workflowName?: string;
  status?: string; // COMPLETED | INITIATED
  steps?: WorkflowStep[];
}

// Pill colours lifted verbatim from the live SCSS.
function pillClass(status: string): string {
  if (['COMPLETED', 'DISPATCHED', 'DELIVERED'].includes(status)) return 'bg-[#ECFDF5] text-[#52a183]';
  if (['INITIATED', 'PROCESSING', 'IN_TRANSIT', 'IN_PROGRESS'].includes(status)) return 'bg-[#FFFBE8] text-[#BB955E]';
  if (['FAILED', 'CANCELLED'].includes(status)) return 'bg-[#FEF6F6] text-[#AE3E39]';
  return 'bg-[#ECFDF5] text-[#52a183]';
}

// Circle colour by step/sub status — bg-anuprerna-10/20/200 from the live config.
function circleClass(status: string): string {
  if (status === 'PENDING' || status === 'HALTED') return 'bg-[#F0EEE9]'; // anuprerna-200
  if (status === 'COMPLETED') return 'bg-[#a7c957]'; // anuprerna-10
  return 'bg-[#f6bd60]'; // anuprerna-20 (IN_PROGRESS)
}

// Connector-line colour between steps (live :after pseudo-element).
function connectorClass(status: string): string {
  if (status === 'COMPLETED') return 'bg-[#a7c957]';
  if (status === 'IN_PROGRESS') return 'bg-[#f6bd60]';
  return 'bg-[#dedede]';
}

export default function ProductionUpdates({
  workflow,
  orderStatus,
}: {
  workflow: OrderwiseWorkflow;
  orderStatus?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!workflow?.workflowId) return null;

  const steps = workflow.steps ?? [];
  const status = workflow.status ?? '';

  // Status pill text — matches the live ngIf ladder exactly.
  let pillText = '';
  let pillStatus = status;
  if (status === 'COMPLETED' && orderStatus === 'IN_TRANSIT') {
    pillText = 'Dispatched';
    pillStatus = 'DISPATCHED';
  } else if (status === 'INITIATED') {
    pillText = 'In-Progress';
    pillStatus = 'INITIATED';
  } else if (status === 'COMPLETED' && orderStatus !== 'IN_TRANSIT') {
    pillText = 'Ready-To-Dispatch';
    pillStatus = 'COMPLETED';
  }

  return (
    <section className="max-w-4xl mx-auto py-2 px-4 rounded-lg my-3 w-full">
      <h3 className="text-xs sm:text-sm font-semibold mb-4 flex gap-2.5 justify-between items-center">
        <span>Production Updates</span>
        {pillText && (
          <span className={'rounded-full px-2 py-0.5 shadow-sm whitespace-nowrap ' + pillClass(pillStatus)}>
            {pillText}
          </span>
        )}
      </h3>

      {/* Collapsed stepper */}
      <div className="w-full flex flex-row justify-start items-start max-w-[420px] overflow-x-auto fb-disable-scrollbar">
        <div className={'w-full flex ' + (steps.length > 2 ? 'justify-between' : 'justify-center')}>
          {steps.map((step, i) => (
            <div key={step.stepId ?? i} className="relative flex flex-col items-center text-center mx-[30px] min-w-[80px]">
              {i > 0 && (
                <span
                  className={'absolute top-[15px] right-[70%] w-[60%] h-[2px] ' + connectorClass(step.stepStatus ?? '')}
                  aria-hidden
                />
              )}
              <div
                className={
                  'h-8 w-8 rounded-full flex items-center justify-center text-[#28282D] text-xs ' +
                  circleClass(step.stepStatus ?? '')
                }
              >
                {step.stepStatus === 'IN_PROGRESS' ? (
                  <span className="text-[9px]">{(step.stepProgress ?? 0).toFixed(1)}%</span>
                ) : (
                  <span className="material-symbols-outlined text-[14px]">
                    {step.stepStatus === 'PENDING' || step.stepStatus === 'HALTED'
                      ? 'hourglass_top'
                      : step.stepStatus === 'COMPLETED'
                      ? 'check'
                      : ''}
                  </span>
                )}
              </div>
              <p className="text-xs mt-2">{step.stepName}</p>
            </div>
          ))}
        </div>
      </div>

      {/* See all updates toggle */}
      <div className="w-full flex justify-center items-center my-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-max text-[#8E7862] border-b-2 pb-1 flex items-center justify-center gap-2 text-xs border-[#6c5b48]"
        >
          <span>{!expanded ? 'See' : 'Hide'}</span> all updates
          <span className="material-symbols-outlined text-[14px] animate-bounce">
            {!expanded ? 'stat_minus_2' : 'stat_2'}
          </span>
        </button>
      </div>

      {/* Expanded detail — step progress bars + sub-process steppers */}
      {expanded && (
        <section className="bg-[#F0EEE9] text-[#28282D] rounded-lg p-0">
          <section className="max-w-4xl mx-auto px-3 py-2 bg-white shadow-md rounded-lg mt-6 mb-6">
            {steps.map((step, i) => (
              <div key={step.stepId ?? i}>
                <div className="border rounded-lg p-4 mt-3">
                  <div className="flex justify-between items-center gap-4">
                    <h4 className="font-semibold">{step.stepName}</h4>
                    <div className="flex-grow">
                      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute top-0 left-0 h-full bg-[#B7A990]"
                          style={{ width: (step.stepProgress ?? 0) + '%' }}
                        />
                      </div>
                    </div>
                    {step.stepStatus !== 'COMPLETED' && step.stepProgress ? (
                      <div className="text-xs">{step.stepProgress.toFixed(1)}%</div>
                    ) : step.stepStatus === 'COMPLETED' && step.stepProgress ? (
                      <div className="text-xs">Completed</div>
                    ) : null}
                  </div>
                </div>

                {step.subProcesses && step.subProcesses.length > 0 && (
                  <div className="flex text-center mb-7 pl-4 md:pl-10 mt-2">
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8">
                      {step.subProcesses.map((sub, j) => (
                        <div key={sub.subProcessId ?? j} className="relative flex flex-col items-center justify-start">
                          <div
                            className={
                              'mt-2 sm:mt-4 h-8 w-8 rounded-full flex items-center justify-center text-[#28282D] text-xs ' +
                              circleClass(sub.subProcessStatus ?? '')
                            }
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {sub.subProcessStatus === 'COMPLETED'
                                ? 'check'
                                : sub.subProcessStatus === 'IN_PROGRESS'
                                ? 'cached'
                                : 'hourglass_top'}
                            </span>
                          </div>
                          <div className="text-xs mt-2 max-w-[140px]">{sub.subProcessName}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>
        </section>
      )}
    </section>
  );
}
