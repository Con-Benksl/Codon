// @ts-nocheck
import { Component } from "react";

// Error boundaries must be class components in React.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#0d1117",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            padding: "32px",
            color: "#bfc8d0",
            fontFamily: "sans-serif",
            fontSize: "14px",
          }}
        >
          <p>
            页面出现错误，请{" "}
            <button
              onClick={() => window.location.reload()}
              style={{
                color: "#81cfff",
                textDecoration: "underline",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              刷新重试
            </button>
            {" "} / Something went wrong.{" "}
            <button
              onClick={() => window.location.reload()}
              style={{
                color: "#81cfff",
                textDecoration: "underline",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </p>
          {this.state.error && (
            <pre
              style={{
                fontSize: "11px",
                color: "#ffb4a1",
                maxWidth: "640px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                border: "1px solid rgba(255,180,161,0.2)",
                borderRadius: "8px",
                padding: "12px",
                textAlign: "left",
              }}
            >
              {String(this.state.error)}
              {"\n\n"}
              {this.state.error.stack ?? ""}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
