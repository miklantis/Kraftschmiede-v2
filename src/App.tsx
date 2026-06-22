// Bewusst minimales Lebenszeichen fuer Phase 0. Noch kein Design-System,
// keine Datenbank, keine Seiten. Dient nur dazu, den Deploy-Weg zu pruefen.
export function App(): React.ReactElement {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        padding: "1.5rem",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Kraftschmiede V2</h1>
      <p style={{ margin: 0, opacity: 0.7 }}>Fundament steht. Aufbau laeuft.</p>
    </main>
  );
}
