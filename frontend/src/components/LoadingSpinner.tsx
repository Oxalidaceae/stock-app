export function LoadingSpinner({ message = '로딩 중...' }: { message?: string }) {
  return (
    <div className="loading-container">
      <div className="spinner" />
      <span>{message}</span>
    </div>
  )
}
