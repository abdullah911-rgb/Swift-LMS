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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={this.handleReload}
              style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '12px 28px', fontWeight: 700, fontSize: 14,
                cursor: 'pointer', width: '100%',
              }}
            >
              🔄 Reload Page
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = '/student/my-courses';
                }
              }}
              style={{
                background: 'transparent', color: '#475569',
                border: '1.5px solid #cbd5e1', borderRadius: 10,
                padding: '10px 28px', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', width: '100%',
              }}
            >
              ← Go Back
            </button>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/student/my-courses';
              }}
              style={{
                background: '#f1f5f9', color: '#64748b',
                border: 'none', borderRadius: 10,
                padding: '10px 28px', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', width: '100%',
              }}
            >
              🏠 Return to My Courses
            </button>
          </div>
        </div>
      </div>
    );
  }
}
