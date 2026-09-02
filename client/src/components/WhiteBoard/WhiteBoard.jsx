import {useEffect, useRef, useState} from "react";
import socket from "../../socket";
import "./WhiteBoard.css";
function Whiteboard({ room }) {
  const canvasRef =
    useRef(null);
  const containerRef =
    useRef(null);
  const drawingRef =
    useRef(false);
  const lastPointRef =
    useRef(null);
  const [brushSize, setBrushSize] =
    useState(3);
  const roomId =
    room?.roomId;

  // CANVAS SIZE
  useEffect(() => {
    const canvas =
      canvasRef.current;
    const container =
      containerRef.current;
    if (!canvas || !container) {
      return;
    }
    const resizeCanvas = () => {
      const rect =
        container.getBoundingClientRect();
      const dpr =
        window.devicePixelRatio || 1;
      // Save existing drawing before resizing
      const oldCanvas = document.createElement("canvas");
      oldCanvas.width = canvas.width;
      oldCanvas.height = canvas.height;
      const oldContext = oldCanvas.getContext("2d");
      if (
        canvas.width > 0 &&
        canvas.height > 0
      ) {
        oldContext.drawImage(
          canvas,
          0,
          0
        );
      }
      canvas.width =
        Math.max(
          1,
          Math.floor(
            rect.width * dpr
          )
        );
      canvas.height =
        Math.max(
          1,
          Math.floor(
            rect.height * dpr
          )
        );
      canvas.style.width =`${rect.width}px`;
      canvas.style.height =`${rect.height}px`;
      const ctx = canvas.getContext("2d");
      ctx.setTransform( dpr,0,0,dpr,0,0);
      ctx.lineCap ="round";
      ctx.lineJoin ="round";
      ctx.strokeStyle ="#111";
      // Restore old canvas
      if (
        oldCanvas.width > 0 &&
        oldCanvas.height > 0
      ) {
        ctx.drawImage(
          oldCanvas,
          0,
          0,
          oldCanvas.width / dpr,
          oldCanvas.height / dpr
        );
      }
    };
    resizeCanvas();
    window.addEventListener(
      "resize",
      resizeCanvas
    );
    return () => {
      window.removeEventListener(
        "resize",
        resizeCanvas
      );
    };
  }, []);
  // DRAW LINE
  const drawLine = ( x1, y1,x2,y2,size) => {
    const canvas =canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect =canvas.getBoundingClientRect();
    const ctx =canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(
      x1 * rect.width,
      y1 * rect.height
    );
    ctx.lineTo(
      x2 * rect.width,
      y2 * rect.height
    );
    ctx.lineWidth =
      Number(size) || 3;
    ctx.lineCap =
      "round";
    ctx.lineJoin =
      "round";
    ctx.strokeStyle =
      "#111";
    ctx.stroke();
  };

  // SOCKET LISTENERS
  useEffect(() => {
    if (!roomId) {
      return;
    }
    console.log(
      "🎨 WHITEBOARD ACTIVE:",
      roomId
    );
    const handleDrawStroke =
      (stroke) => {
        console.log(
          "🎨 RECEIVED DRAW:",
          stroke
        );
        drawLine(
          Number(stroke.x1),
          Number(stroke.y1),
          Number(stroke.x2),
          Number(stroke.y2),
          Number(stroke.size)
        );
      };
    const handleCanvasHistory =
      ({ strokes }) => {
        console.log(
          "🖼️ RECEIVED CANVAS:",
          strokes?.length
        );
        if (!Array.isArray(strokes)) {
          return;
        }
        strokes.forEach(
          (stroke) => {
            drawLine(
              stroke.x1,
              stroke.y1,
              stroke.x2,
              stroke.y2,
              stroke.size
            );
          }
        );
      };
    const handleClear =
      () => {
        clearCanvasLocal();
      };
    socket.on(
      "draw-stroke",
      handleDrawStroke
    );
    socket.on(
      "canvas-history",
      handleCanvasHistory
    );
    socket.on(
      "clear-canvas",
      handleClear
    );
    // Request existing drawing
    socket.emit(
      "request-canvas-history",
      {
        roomId,
      }
    );
    return () => {
      socket.off(
        "draw-stroke",
        handleDrawStroke
      );
      socket.off(
        "canvas-history",
        handleCanvasHistory
      );
      socket.off(
        "clear-canvas",
        handleClear
      );
    };
  }, [roomId]);
  
  // GET POINt
  const getPoint = (
    event
  ) => {
    const canvas =
      canvasRef.current;
    const rect =
      canvas.getBoundingClientRect();
    return {
      x:
        (event.clientX - rect.left) /
        rect.width,
      y:
        (event.clientY - rect.top) /
        rect.height,
    };
  };
  // START DRAWING
  const startDrawing =
    (event) => {
      event.preventDefault();
      drawingRef.current =
        true;
      lastPointRef.current =
        getPoint(event);
      canvasRef.current?.setPointerCapture(
        event.pointerId
      );
    };
// DRAW
  const draw =
    (event) => {
      if (
        !drawingRef.current
      ) {
        return;
      }
      event.preventDefault();
      const currentPoint =getPoint(event);
      const previousPoint =lastPointRef.current;
      if (!previousPoint) {
        lastPointRef.current =currentPoint;
        return;
      }
      // DRAW LOCALLY
      drawLine(
        previousPoint.x,
        previousPoint.y,
        currentPoint.x,
        currentPoint.y,
        brushSize
      );
      // SEND TO SERVER
      if (
        roomId &&
        socket.connected
      ) {
        const stroke = {
          roomId,
          x1:
            previousPoint.x,
          y1:
            previousPoint.y,
          x2:
            currentPoint.x,
          y2:
            currentPoint.y,
          size:
            brushSize,
        };
        console.log(
          "🎨 SENDING DRAW:",
          stroke
        );
        socket.emit(
          "draw-stroke",
          stroke
        );
      } else {
        console.warn(
          "⚠️ DRAW NOT SENT - SOCKET NOT CONNECTED"
        );
      }
      lastPointRef.current =
        currentPoint;

    };
  // STOP DRAWING
  const stopDrawing = (event) => {
      drawingRef.current =false;
      lastPointRef.current =null;
      try {

        canvasRef.current?.releasePointerCapture(
          event.pointerId
        );

      } catch {}

    };
  // CLEAR LOCA
  const clearCanvasLocal =
    () => {

      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }


      const rect = canvas.getBoundingClientRect();

      const ctx =canvas.getContext("2d");


      ctx.clearRect(
        0,
        0,
        rect.width,
        rect.height
      );
    };
  // CLEAR CANVAS

  const clearCanvas =
    () => {

      clearCanvasLocal();


      if (
        socket.connected &&
        roomId
      ) {

        socket.emit(
          "clear-canvas",
          {
            roomId,
          }
        );

      }

    };
  return (

    <div className="whiteboard">

      <div className="whiteboard-header">

        <div>

          <strong>
            Canvas
          </strong>

          <span className="canvas-live">
            ● LIVE
          </span>

        </div>


        <div className="brush-control">

          <span>
            Brush
          </span>

          <input
            type="range"
            min="1"
            max="12"
            value={brushSize}
            onChange={(event) =>
              setBrushSize(
                Number(
                  event.target.value
                )
              )
            }
          />

        </div>

      </div>


      <div
        ref={containerRef}
        className="whiteboard-canvas-container"
      >

        <canvas
          ref={canvasRef}

          onPointerDown={
            startDrawing
          }

          onPointerMove={
            draw
          }

          onPointerUp={
            stopDrawing
          }

          onPointerCancel={
            stopDrawing
          }

          onPointerLeave={
            stopDrawing
          }

          style={{
            display: "block",
            width: "100%",
            height: "100%",
            touchAction: "none",
            cursor: "crosshair",
          }}
        />

      </div>


      <div className="whiteboard-tools">

        <button
          onClick={clearCanvas}
        >
          Clear
        </button>

      </div>

    </div>

  );

}

export default Whiteboard;