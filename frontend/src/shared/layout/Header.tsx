export default function Header() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "24px",
          }}
        >
          Home Finance OS
        </h1>

        <p
          style={{
            margin: "4px 0 0 0",
            color: "#6B7280",
          }}
        >
          Financial Clarity Through Transparency
        </p>
      </div>

      <div
        style={{
          textAlign: "right",
        }}
      >
        <strong>Founder & Product Owner</strong>

        <br />

        Franz Bunsoy
      </div>
    </div>
  );
}
