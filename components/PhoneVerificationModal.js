// components/PhoneVerificationModal.js
// Phone verification modal for two-factor authentication
// Props:
//   - isOpen: boolean
//   - onClose: function
//   - onVerified: function(phone) - called when verification succeeds
//   - initialPhone: string (optional) - pre-filled phone number

'use client'

import { useState, useEffect } from 'react'
import { sendPhoneVerificationCode, verifyPhoneCode } from '@/lib/supabase/phone'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function PhoneVerificationModal({ 
  isOpen, 
  onClose, 
  onVerified,
  initialPhone = '' 
}) {
  const [phone, setPhone] = useState(initialPhone)
  const [code, setCode] = useState('')
  const [step, setStep] = useState('phone') // 'phone' or 'code'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [canResend, setCanResend] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  // Format phone number as user types (basic E.164 formatting)
  const formatPhone = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // If starts with +, keep it, otherwise add +
    if (value.startsWith('+')) {
      return '+' + digits
    } else if (digits.length > 0) {
      return '+' + digits
    }
    return ''
  }

  // Handle phone input
  const handlePhoneChange = (e) => {
    const formatted = formatPhone(e.target.value)
    setPhone(formatted)
    setError(null)
  }

  // Send verification code
  const handleSendCode = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validate phone format (basic E.164 check)
    if (!phone || phone.length < 10 || !phone.startsWith('+')) {
      setError('Please enter a valid phone number in international format (e.g., +1234567890)')
      return
    }

    setLoading(true)

    try {
      const result = await sendPhoneVerificationCode(phone)
      
      if (result.error) {
        setError(result.error.message || 'Failed to send verification code')
        return
      }

      // Success - move to code step
      setStep('code')
      setSuccess(true)
      setCanResend(false)
      setResendCountdown(60) // 60 second cooldown
      
      // Start countdown timer
      const timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setError(err.message || 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  // Verify code
  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setError(null)

    if (!code || code.length !== 6) {
      setError('Please enter the 6-digit verification code')
      return
    }

    setLoading(true)

    try {
      const result = await verifyPhoneCode(phone, code)
      
      if (result.error) {
        setError(result.error.message || 'Invalid verification code')
        return
      }

      if (result.data?.verified) {
        onVerified(phone)
        handleClose()
      } else {
        setError('Invalid verification code')
      }
    } catch (err) {
      setError(err.message || 'Failed to verify code')
    } finally {
      setLoading(false)
    }
  }

  // Handle code input (only allow digits, max 6)
  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(value)
    setError(null)
  }

  // Resend code
  const handleResendCode = async () => {
    if (!canResend) return
    
    setError(null)
    setLoading(true)

    try {
      const result = await sendPhoneVerificationCode(phone)
      if (result.error) {
        setError(result.error.message || 'Failed to resend code')
        return
      }

      // Success
      setSuccess(true)
      setCanResend(false)
      setResendCountdown(60)
      
      const timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setError(err.message || 'Failed to resend code')
    } finally {
      setLoading(false)
    }
  }

  // Reset state when modal closes
  const handleClose = () => {
    setPhone(initialPhone)
    setCode('')
    setStep('phone')
    setError(null)
    setSuccess(false)
    setCanResend(false)
    setResendCountdown(0)
    onClose()
  }

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhone(initialPhone)
      setStep('phone')
      setCode('')
      setError(null)
      setSuccess(false)
    }
  }, [isOpen, initialPhone])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6"
      onClick={handleClose}
    >
      <Card
        className="w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-medium hover:text-neutral-black transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center"
          aria-label="Close"
        >
          ×
        </button>

        {/* Title */}
        <h2 className="text-heading1 text-neutral-black mb-6">
          {step === 'phone' ? 'Verify Phone Number' : 'Enter Verification Code'}
        </h2>

        {/* Success message */}
        {success && step === 'code' && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-success text-success rounded-md">
            Verification code sent to {phone}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-error text-error rounded-md">
            {error}
          </div>
        )}

        {/* Phone input step */}
        {step === 'phone' && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-bodySmall font-semibold mb-2 text-neutral-black"
              >
                Phone Number
              </label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+1234567890"
                required
              />
              <p className="mt-1 text-caption text-gray-medium">
                Include country code (e.g., +1 for US)
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !phone}
              variant="primary"
              size="large"
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </form>
        )}

        {/* Code verification step */}
        {step === 'code' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-bodySmall font-semibold mb-2 text-neutral-black"
              >
                Verification Code
              </label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={handleCodeChange}
                placeholder="123456"
                maxLength={6}
                required
                className="text-center text-2xl tracking-widest"
              />
              <p className="mt-1 text-caption text-gray-medium text-center">
                Enter the 6-digit code sent to {phone}
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || code.length !== 6}
              variant="primary"
              size="large"
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>

            {/* Resend code */}
            <div className="text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-bodySmall text-neutral-black underline hover:no-underline transition-colors"
                >
                  Resend code
                </button>
              ) : (
                <p className="text-bodySmall text-gray-medium">
                  Resend code in {resendCountdown}s
                </p>
              )}
            </div>

            {/* Change phone number */}
            <button
              type="button"
              onClick={() => {
                setStep('phone')
                setCode('')
                setError(null)
              }}
              className="w-full text-bodySmall text-gray-medium hover:text-neutral-black transition-colors"
            >
              Change phone number
            </button>
          </form>
        )}
      </Card>
    </div>
  )
}

