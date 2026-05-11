export function ErrorFallback({ message = '데이터를 불러오지 못했습니다.' }: { message?: string }) {
  return (
    <div className="error-state">
      <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚠</div>
      <div>{message}</div>
    </div>
  )
}
