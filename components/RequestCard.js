// components/RequestCard.js
// Card component for displaying event requests with approve/deny actions and safety tier badges

'use client'

import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import SafetyBadge from '@/components/SafetyBadge'
import { formatTimeAgo } from '@/lib/utils/timeFormatting'

export default function RequestCard({
  request,
  onApprove,
  onDeny,
  onViewProfile,
  loading = false,
  showCheckbox = false,
  selected = false,
  onSelect,
}) {
  if (!request || !request.user) {
    return null
  }

  const { user, safety_tier, requested_at, status } = request

  return (
    <Card variant="default" className="p-4">
      <div className="flex items-center gap-4">
        {/* Checkbox for bulk selection */}
        {showCheckbox && (
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect && onSelect(request.id, e.target.checked)}
            className="w-5 h-5 rounded border-gray-border text-primary-ui focus:ring-primary-ui"
            disabled={loading}
          />
        )}

        {/* Avatar */}
        <Avatar
          src={user.profile_pic}
          alt={user.name}
          size="lg"
        />

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-dark truncate">
              {user.name}
            </h3>
            {safety_tier?.tier && (
              <SafetyBadge
                tier={safety_tier.tier}
                score={safety_tier.score}
                size="sm"
              />
            )}
          </div>
          {user.year && (
            <p className="text-sm text-gray-medium">
              Year {user.year}
            </p>
          )}
          <p className="text-xs text-gray-medium mt-1">
            Requested {formatTimeAgo(requested_at)}
          </p>
        </div>

        {/* Actions */}
        {status === 'pending' && (
          <div className="flex flex-col gap-2">
            <Button
              variant="primary"
              size="small"
              onClick={() => onApprove && onApprove(request.id)}
              disabled={loading}
            >
              Approve
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => onDeny && onDeny(request.id)}
              disabled={loading}
            >
              Deny
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

