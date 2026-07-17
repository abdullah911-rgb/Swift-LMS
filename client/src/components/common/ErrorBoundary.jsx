import React from 'react';

/**
 * Global Error Boundary — catches render crashes so they don't bring down the whole app.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught render error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        padding: 24,
      }}>
        <div style={{
          background: '#fff',
          border: '1px solid #fee2e2',
          borderRadius: 20,
          padding: '40px 48px',
          maxWidth: 480,
          textAlign: 'center',
          boxShadow: '0 4px 32px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#dc2626', fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>
            Something Went Wrong
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
            This page encountered an unexpected error. Your session is still active — try reloading.
          </p>
          {this.state.error?.message && (
            <p style={{
              background: '#fef2f2', color: '#991b1b', fontSize: 12,
              borderRadius: 8, padding: '8px 12px', marginBottom: 20,
              fontFamily: 'monospace', wordBreak: 'break-word', textAlign: 'left',
            }}>
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReload}
            style={{
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '10px 28px', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', width: '100%',
            }}
          >
            🔄 Reload Page
          </button>
          <button
            onClick={() => window.history.back()}
            style={{
              background: 'transparent', color: '#64748b',
              border: '1.5px solid #e2e8f0', borderRadius: 10,
              padding: '10px 28px', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', width: '100%', marginTop: 10,
            }}
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }
}
