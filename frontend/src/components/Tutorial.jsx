import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { useState } from 'react'

/**
 * Tutorial overlay — shows step-by-step usage guides.
 * Props:
 *   steps:   Array<{ title, description, tip? }>
 *   onClose: () => void
 */
export default function Tutorial({ steps, onClose }) {
  const [step, setStep] = useState(0)
  const current = steps[step]
  const isLast  = step === steps.length - 1
  const isFirst = step === 0

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,28,53,.55)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Panel — stop click from closing */}
        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit={{   opacity: 0, scale: 0.92, y: 20  }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: '#fff',
            borderRadius: 16,
            width: 520,
            boxShadow: '0 24px 64px rgba(0,0,0,.22)',
            overflow: 'hidden',
          }}
        >
          {/* Header gradient */}
          <div style={{
            background: 'linear-gradient(135deg, #0F1C35 0%, #1B2E4A 100%)',
            padding: '24px 28px 20px',
            position: 'relative',
          }}>
            {/* Step progress dots */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {steps.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width:   i === step ? 24 : 8,
                    opacity: i === step ? 1 : 0.35,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    height: 6, borderRadius: 99,
                    background: '#C9A84C',
                  }}
                />
              ))}
            </div>

            <div style={{ fontSize: 11, color: '#5A7A9A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 6 }}>
              Step {step + 1} of {steps.length}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Lora, serif', lineHeight: 1.3 }}>
              {current.title}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(255,255,255,.1)', border: 'none',
                borderRadius: 8, width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff',
                transition: 'background .15s',
              }}
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,.2)'}
              onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,.1)'}
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0  }}
              exit={{   opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              style={{ padding: '24px 28px' }}
            >
              <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.8, margin: 0 }}>
                {current.description}
              </p>

              {current.tip && (
                <div style={{
                  marginTop: 16,
                  padding: '12px 16px',
                  background: 'linear-gradient(135deg, rgba(201,168,76,.08), rgba(201,168,76,.15))',
                  border: '1px solid rgba(201,168,76,.3)',
                  borderRadius: 10,
                  fontSize: 13,
                  color: '#92400E',
                  lineHeight: 1.6,
                }}>
                  <strong style={{ color: '#C9A84C' }}>💡 Tip: </strong>
                  {current.tip}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <div style={{
            padding: '16px 28px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <button
              disabled={isFirst}
              onClick={() => setStep(s => s - 1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: '1.5px solid #E2E8F0',
                borderRadius: 8, padding: '8px 16px',
                fontSize: 13, color: isFirst ? '#CBD5E1' : '#64748B',
                cursor: isFirst ? 'default' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all .15s',
              }}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            <span style={{ fontSize: 12, color: '#94A3B8' }}>
              Press <kbd style={{ background: '#E2E8F0', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>Esc</kbd> to close
            </span>

            {isLast ? (
              <button
                onClick={onClose}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#0F1C35', border: 'none',
                  borderRadius: 8, padding: '8px 20px',
                  fontSize: 13, fontWeight: 600, color: '#fff',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                Got it! ✓
              </button>
            ) : (
              <button
                onClick={() => setStep(s => s + 1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#0F1C35', border: 'none',
                  borderRadius: 8, padding: '8px 20px',
                  fontSize: 13, fontWeight: 600, color: '#fff',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
