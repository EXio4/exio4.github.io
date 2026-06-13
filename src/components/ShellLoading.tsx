import './ShellLoading.css'

export default function ShellLoading() {
  return (
    <div className="shell-loading">
      <div className="shell-loading-dots">
        <div className="shell-loading-dot" />
        <div className="shell-loading-dot" />
        <div className="shell-loading-dot" />
      </div>
      <div className="shell-loading-label">Loading</div>
    </div>
  )
}
