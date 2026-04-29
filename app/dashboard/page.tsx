export default function DashboardPage() {
  return (
    <main style={{ padding: "2rem", color: "white" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "2rem" }}>
        System Capital Dashboard
      </h1>

      <div style={{ display: "flex", gap: "1.5rem" }}>
        
        {/* Card */}
        <div style={cardStyle}>
          <p style={labelStyle}>Member Applications</p>
          <h2>128</h2>
        </div>

        {/* Card */}
        <div style={cardStyle}>
          <p style={labelStyle}>High Priority Signals</p>
          <h2>17</h2>
        </div>

        {/* Card */}
        <div style={cardStyle}>
          <p style={labelStyle}>Latest Member</p>
          <h3>Terry Brown</h3>
          <small style={{ opacity: 0.6 }}>
            CEO, Brown Capital
          </small>
        </div>

      </div>
    </main>
  );
}

const cardStyle = {
  background: "#111",
  padding: "1.5rem",
  borderRadius: "16px",
  width: "240px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.3)"
};

const labelStyle = {
  fontSize: "0.9rem",
  opacity: 0.6,
  marginBottom: "0.5rem"
};