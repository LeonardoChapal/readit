interface Props {
  text: string
  query: string
}

export default function Highlight({ text, query }: Props) {
  if (!query.trim()) return <>{text}</>

  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark key={i} className="bg-orange-100 text-[#f97316] rounded px-0.5 not-italic font-semibold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}
