import CanvasEditor from "../components/CanvasEditor.jsx";

export default function Conference() {
  return (
    <section className="page">
      <div className="container">
        <h1 className="editor-head">Conference Planner</h1>
        <p className="editor-subtitle">
          Plan your sessions and seating. Pinch/scroll to zoom, drag with two
          fingers to pan.
        </p>



        {/* 画布容器：外框 + 网格背景，内部渲染 Konva Stage */}
        <div className="editor-canvas">
          <div className="grid-bg">
            <CanvasEditor
              storageKey="layout.conference.v1"
              remoteName="conference"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
