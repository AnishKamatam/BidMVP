// components/MessageInput.js
// Input component for sending messages

'use client'

import { memo, useState, useRef, useEffect, useCallback } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

function MessageInput({ conversationId, onSend, disabled = false, placeholder = 'Type a message...' }) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const inputRef = useRef(null)

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus()
    }
  }, [disabled])

  const handleSend = useCallback(async () => {
    if (!content.trim() || disabled || sending) return

    const messageContent = content.trim()
    setContent('')
    setSending(true)

    try {
      await onSend(conversationId, messageContent)
    } catch (error) {
      // Restore content on error
      setContent(messageContent)
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
      // Refocus input
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }, [content, disabled, sending, conversationId, onSend])

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleChange = useCallback((e) => {
    setContent(e.target.value)
  }, [])

  return (
    <div className="flex gap-2 px-4 py-3 bg-white border-t border-gray-border">
      <Input
        ref={inputRef}
        type="text"
        value={content}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled || sending}
        className="flex-1"
      />
      <Button
        variant="primary"
        onClick={handleSend}
        disabled={!content.trim() || disabled || sending}
      >
        {sending ? 'Sending...' : 'Send'}
      </Button>
    </div>
  )
}

export default memo(MessageInput)

