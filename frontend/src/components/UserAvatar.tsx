import { useState } from 'react'
import { avatarUrl } from '../lib/api'

interface Props {
  username: string
  className?: string
  bust?: number
}

export default function UserAvatar({ username, className = 'w-8 h-8', bust }: Props) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className={`${className} rounded-full bg-[#f97316] flex items-center justify-center text-white font-bold flex-shrink-0`}>
        <span style={{ fontSize: 'clamp(0.5rem, 40%, 1.25rem)' }}>
          {username[0].toUpperCase()}
        </span>
      </div>
    )
  }

  return (
    <img
      src={avatarUrl(username, bust)}
      alt={username}
      className={`${className} rounded-full object-cover flex-shrink-0`}
      onError={() => setError(true)}
    />
  )
}
