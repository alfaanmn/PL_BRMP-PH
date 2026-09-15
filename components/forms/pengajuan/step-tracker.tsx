'use client'

import React from 'react'

export interface StepTrackerProps {
  currentStep: 1 | 2 | 3
  onStepClick?: (step: 1 | 2 | 3) => void
  allowNavigation?: boolean
}

export const WIZARD_STEPS = [
  {
    step: 1,
    title: 'Data & rencana',
  },
  {
    step: 2,
    title: 'Dokumen',
  },
  {
    step: 3,
    title: 'Review',
  },
]

export function ApplicationStepTracker({
  currentStep,
  onStepClick,
  allowNavigation = true,
}: StepTrackerProps) {
  return (
    <div style={{
      width: '100%',
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '1.25rem 1.5rem',
      marginBottom: '1rem',
      boxSizing: 'border-box'
    }}>
      {/* Horizontal Stepper Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '560px',
        margin: '0 auto',
        gap: '0.75rem'
      }}>
        {WIZARD_STEPS.map((item, idx) => {
          const isCompleted = item.step < currentStep
          const isCurrent = item.step === currentStep
          const isUpcoming = item.step > currentStep
          const isClickable = allowNavigation && isCompleted && Boolean(onStepClick)

          return (
            <React.Fragment key={item.step}>
              {/* Step Item */}
              <div
                onClick={() => isClickable && onStepClick?.(item.step as 1 | 2 | 3)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: isClickable ? 'pointer' : 'default',
                  userSelect: 'none'
                }}
              >
                {/* 24x24px Circle */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: (isCompleted || isCurrent) ? '#16a34a' : '#ffffff',
                    border: (isCompleted || isCurrent) ? '1px solid #16a34a' : '1px solid #cbd5e1',
                    color: (isCompleted || isCurrent) ? '#ffffff' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    flexShrink: 0
                  }}
                >
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    item.step
                  )}
                </div>

                {/* Label */}
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: isCurrent ? 600 : isCompleted ? 500 : 400,
                  color: isCurrent ? '#0f172a' : isCompleted ? '#16a34a' : '#94a3b8',
                  whiteSpace: 'nowrap'
                }}>
                  {item.title}
                </span>
              </div>

              {/* Connecting Line between steps */}
              {idx < WIZARD_STEPS.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '1px',
                  minWidth: '24px',
                  maxWidth: '60px',
                  backgroundColor: item.step < currentStep ? '#16a34a' : '#e2e8f0'
                }} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
