import CanvasEditor from "../components/CanvasEditor.jsx";

export default function Tradeshow() {
  return (
    <section className="page">
      <div className="container">
        <h1 className="editor-head">Trade Show Planner</h1>
        <p className="editor-subtitle">
          Plan your booths and aisles. Pinch/scroll to zoom, drag with two
          fingers to pan.
        </p>


        <div className="editor-canvas">
          <div className="grid-bg">
            <CanvasEditor
              storageKey="layout.tradeshow.v1"
              remoteName="tradeshow"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
