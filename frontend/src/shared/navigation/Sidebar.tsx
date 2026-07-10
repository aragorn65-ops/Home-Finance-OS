const menuItems = [
  "🏠 Dashboard",
  "💵 Expenses",
  "🤝 Settlements",
  "💰 Savings",
  "⚡ Utilities",
  "📊 Reports",
  "⚙ Settings",
];

export default function Sidebar() {
  return (
    <>
      <h2 style={{ marginTop: 0 }}>HFOS</h2>

      <p
        style={{
          color: "#9CA3AF",
          fontSize: "12px",
          marginBottom: "30px",
        }}
      >
        Financial Clarity Through Transparency
      </p>

      <nav>
        {menuItems.map((item) => (
          <div
            key={item}
            style={{
              padding: "12px",
              marginBottom: "8px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            {item}
          </div>
        ))}
      </nav>

      <hr
        style={{
          margin: "30px 0",
          borderColor: "#374151",
        }}
      />

      <div
        style={{
          padding: "12px",
          borderRadius: "8px",
          background: "#374151",
        }}
      >
        🏛 Governance
      </div>
    </>
  );
}
