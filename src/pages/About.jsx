export default function About() {
  return (
    <section className="page about">
      <h1>About Clover 4</h1>
      <p>
        Clover 4 is an interactive front-end tool for event-venue layout and
        seat management. It helps planners quickly draw floor-plans, arrange
        seating, and provide attendees with friendly, real-time information
        during the event.
      </p>
      <ul>
        <li>Drag-and-drop layout (tables, booths, stages, etc.)</li>
        <li>Group / zone management with constraints (access, dietary needs)</li>
        <li>Optional back-end API integration (Django / DRF)</li>
        <li>Optional extensions such as QR-code check-in or large-screen display</li>
      </ul>
    </section>
  );
}