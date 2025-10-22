// EventVenue.jsx (excerpt)
export default function EventVenue() {
  return (
    <section className="page">
      <div className="container hero">
        <div>
          <h1>Visualize Your Event Layouts</h1>
          <p>
            Clover 4 helps you create dynamic seating plans, organize
            participants, and keep everything updated effortlessly.
          </p>
          <div className="hero-buttons">
            <a className="btn btn-primary" href="#">
              Wedding Planner
            </a>
            <a className="btn" href="#">
              Trade Show Planner
            </a>
          </div>
        </div>

        <div className="hero-img">Hero Image</div>
      </div>

      <div className="container features">
        <div className="feature">
          <div className="icon">▦</div>
          <div>
            <h3>Venue Layout Design</h3>
            <p>
              Design and customize event spaces with interactive tools to
              arrange tables, stages, and booths.
            </p>
          </div>
        </div>
        {/* The remaining five feature cards follow the same structure */}
      </div>

      <div className="container" style={{ marginTop: 24 }}>
        <div className="card">
          <img alt="Wedding layout" />
          <h2>Create the perfect wedding layout</h2>
          <p>
            Design your dream wedding layout with our easy-to-use planner.
            Customize seating, décor, and more.
          </p>
          <button className="btn btn-primary">Start Planning</button>
        </div>

        <div className="card">
          <img alt="Tradeshow layout" />
          <h2>Optimize your trade show space</h2>
          <p>
            Arrange booths, manage traffic flow, and enhance exhibitor
            visibility to create an engaging event.
          </p>
          <button className="btn">Start Planning</button>
        </div>
      </div>
    </section>
  );
}
