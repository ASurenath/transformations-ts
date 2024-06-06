import React, { useEffect, useRef, useState } from "react";
import Help from "./Help";
import { info } from "../informations";

interface objectsState {
  [key: string]: [number, number][];
}

const renderLine = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bx1: number,
  bx2: number,
  by1: number,
  by2: number,
  color: string,
  width: number,
  strokeDasharray: string
) => {
  if (x1 === x2) {
    let Y1 = by1;
    let Y2 = by2;
    let X1 = x1;
    let X2 = x1;
    return (
      <>
        <line
          x1={X1}
          y1={Y1}
          x2={X2}
          y2={Y2}
          stroke={color || "black"}
          strokeWidth={width || 0.1}
          strokeDasharray={strokeDasharray || "none"}
        />
      </>
    );
  } else if (y1 === y2) {
    let X1 = bx1;
    let X2 = bx2;
    let Y1 = y1;
    let Y2 = y1;
    return (
      <>
        <line
          x1={X1}
          y1={Y1}
          x2={X2}
          y2={Y2}
          stroke={color || "black"}
          strokeWidth={width || 0.1}
          strokeDasharray={strokeDasharray || "none"}
        />
      </>
    );
  } else {
    let X1 = bx1;
    let Y1 = ((y2 - y1) * (X1 - x1)) / (x2 - x1) + y1;
    let X2 = bx2;
    let Y2 = ((y2 - y1) * (X2 - x1)) / (x2 - x1) + y1;
    return (
      <>
        <line
          x1={X1}
          y1={Y1}
          x2={X2}
          y2={Y2}
          stroke={color || "black"}
          strokeWidth={width || 0.1}
          strokeDasharray={strokeDasharray || "none"}
        />
      </>
    );
  }
};

const reflect = ([x, y]: [number, number], [[x1, y1], [x2, y2]]: [[number, number], [number, number]]): [number, number] => {
  if (x1 === x2) {
    return [2 * x1 - x, y];
  } else if (y1 === y2) {
    return [x, 2 * y1 - y];
  } else {
    let a = (y2 - y1) / (x2 - x1);
    let b = y1 - a * x1;
    let x_ =
      (x * (1 - a ** 2)) / (1 + a ** 2) + ((y - b) * 2 * a) / (1 + a ** 2);
    let y_ =
      b + (x * 2 * a) / (1 + a ** 2) + ((y - b) * (a ** 2 - 1)) / (1 + a ** 2);
    return [x_, y_];
  }
};
const rotate = ([x, y]: [number, number], [x1, y1]: [number, number], angle: number, isClockwise: boolean): [number, number] => {
  if (isClockwise) {
    let newX =
      (x - x1) * Math.cos((angle * Math.PI) / 180) +
      (y - y1) * Math.sin((angle * Math.PI) / 180) +
      x1;
    let newY =
      -(x - x1) * Math.sin((angle * Math.PI) / 180) +
      (y - y1) * Math.cos((angle * Math.PI) / 180) +
      y1;
    return [newX, newY];
  } else {
    let newX =
      (x - x1) * Math.cos((angle * Math.PI) / 180) -
      (y - y1) * Math.sin((angle * Math.PI) / 180) +
      x1;
    let newY =
      (x - x1) * Math.sin((angle * Math.PI) / 180) +
      (y - y1) * Math.cos((angle * Math.PI) / 180) +
      y1;
    return [newX, newY];
  }
};
const translate = ([x, y]: [number, number], [[x1, y1], [x2, y2]]: [[number, number], [number, number]]): [number, number] => {
  return [x + x2 - x1, y + y2 - y1];
};
const enlarge = ([x, y]: [number, number], [x1, y1]: [number, number], f: number): [number, number] => {
  return [x1 + f * (x - x1), y1 + f * (y - y1)];
};
const lineEquation = ([[x1, y1], [x2, y2]]: [[number, number], [number, number]]): string => {
  if (x1 === x2) {
    return `x = ${x1}`;
  } else if (y1 === y2) {
    return `y = ${y1}`;
  } else {
    let a = Math.round(((y2 - y1) / (x2 - x1)) * 1000) / 1000;
    let b = Math.round((y1 - a * x1) * 1000) / 1000;
    if (a == 1) {
      return `y=x+${b}`;
    } else if (a == -1) {
      return `y=-x+${b}`;
    } else {
      return `y = ${a}x + ${b}`;
    }
  }
};

function Graph({ x1, x2, y1, y2 }: { x1: number, x2: number, y1: number, y2: number }) {
  const [hoveredPoint, setHoveredPoint] = useState<[number, number]|null>(null);
  const [hoveredObjectPoint, setHoveredObjectPoint] = useState<[number, number]|null>(null);
  const [selectedObjectPoint, setSelectedObjectPoint] = useState<[number, number]|null>([-4, 5]);
  const [transformation, setTransformation] = useState<string>("reflection");
  const [tool, setTool] = useState<string>("select");
  const [zoom, setZoom] = useState<number>(100);
  const [minZoom, setMinZoom] = useState<number>(100);
  const [showInfo, setShowInfo] = useState<boolean>(false);
  const [showHelp1, setShowHelp1] = useState<boolean>(true);
  const [showHelp2, setShowHelp2] = useState<boolean>(false);
  const [isVisited, setIsVisited] = useState<{[key: string]: boolean}>({rotation:false,translation:false,enlargement:false});
  const [showDeletePrompt, setShowDeletePrompt] = useState<boolean>(false);
const [showCoords, setShowCoords] = useState<boolean>(false);
  // object
  const [objects, setObjects] = useState<objectsState>({
    demo: [
      [-4, 5],
      [-4, 9],
      [-2, 5],
    ],
  });
  const [tempObjectPoints, setTempObjectPoints] = useState<[number, number][]>([]);
  const [selectedObject, setSelectedObject] = useState<string>("");
  const [selectionCoordinates, setSelectionCoordinates] = useState<{ x1: number; x2: number; y1: number; y2: number }>({
    x1: NaN,
    x2: NaN,
    y1: NaN,
    y2: NaN,
  });
    // reflection
    const [reflectImages, setReflectImages] = useState<objectsState>({});
    const [mirrorLinePoints, setMirrorLinePoints] = useState<[[number, number], [number, number]]>([
      [-5, 0],
      [0, 5],
    ]);
    const [tempMirrorLinePoints, setTempMirrorLinePoints] = useState<[number, number][]>([]);
  
    // rotation
    const [centerOfRotation, setCenterOfRotation] = useState<[number, number]|null>([-2, 2]);
    const [isClockwise, setIsClockwise] = useState<boolean>(true);
    const [rotationAngle, setRotationAngle] = useState<number>(90);
    const [rotatedImages, setRotatedImages] = useState<objectsState>({});
  
    //translation
    const [tempTransVector, setTempTransVector] = useState<[number, number][]|null>([]);
    const [transVector, setTransVector] = useState<[[number, number],[number,number]]>([
      [0, 0],
      [3, 1],
    ]);
    const [transImages, setTransImages] = useState<objectsState>({});
  
    // enlargement
    const [enlargedImages, setEnlargedImages] = useState<objectsState>({});
    const [enlargementFactor, setEnlargementFactor] = useState<number>(2);
    const [centerOfEnlargement, setCenterOfEnlargement] = useState<[number, number]>([-9, 9]);
  
    const graphBox = useRef<HTMLDivElement>(null);
    const scrollBox = useRef<HTMLDivElement>(null);
  
    const color1: string = "#1783b8";
    const color2: string = "#4dc0ae";
    const zoomFactor: number = 30;
    // console.log(objects);
useEffect(()=>{
  if(transformation!=="reflection"){
    if(!isVisited[transformation as keyof typeof isVisited]){
      setShowHelp2(true);
      setIsVisited({...isVisited,[transformation]:true})
    }
  }
},[transformation])
// console.log(isVisited);



  // reflection
  useEffect(() => {
    if (mirrorLinePoints.length == 2) {
      let tempReflectImages: objectsState = {};
      for (let key in objects) {
        let tempObj = objects[key];
        let tempImage = tempObj.map((point) =>
          reflect(point, mirrorLinePoints)
        );
        tempReflectImages[key] = [...tempImage];
        // console.log("tempImage", tempImage);
      }
      setReflectImages({ ...tempReflectImages });
    } else {
      setReflectImages({});
    }
  }, [objects, mirrorLinePoints]);
  // rotation
  useEffect(() => {
    if (centerOfRotation) {
      let tempRotImages: objectsState = {};
      for (let key in objects) {
        let tempObj = objects[key];
        let tempImage = tempObj.map((point) =>
          rotate(point, centerOfRotation, rotationAngle, isClockwise)
        );
        tempRotImages[key] = [...tempImage];
      }
      setRotatedImages({ ...tempRotImages });
    }
  }, [objects, centerOfRotation, rotationAngle, isClockwise]);
  // translation
  useEffect(() => {
    if (transVector.length == 2) {
      let tempTransImages: objectsState = {};
      for (let key in objects) {
        let tempObj = objects[key];
        let tempImage = tempObj.map((point) => translate(point, transVector));
        tempTransImages[key] = [...tempImage];
      }
      setTransImages({ ...tempTransImages });
    }
  }, [objects, transVector]);
  // Enlarge
  useEffect(() => {
    if (enlargementFactor) {
      let tempEnlargeImages: objectsState = {};
      for (let key in objects) {
        let tempObj = objects[key];
        let tempImage = tempObj.map((point) =>
          enlarge(point, centerOfEnlargement, enlargementFactor)
        );
        tempEnlargeImages[key] = [...tempImage];
      }
      setEnlargedImages({ ...tempEnlargeImages });
    }
  }, [objects, centerOfEnlargement, enlargementFactor]);

  // selection coordinates
  useEffect(() => {
    if (objects[selectedObject]) {
      let tempObj = objects[selectedObject];
      let x1 = Math.min(...tempObj.map((point) => point[0])) - 0.1;
      let x2 = Math.max(...tempObj.map((point) => point[0])) + 0.1;
      let y1 = Math.min(...tempObj.map((point) => point[1])) - 0.1;
      let y2 = Math.max(...tempObj.map((point) => point[1])) + 0.1;
      setSelectionCoordinates({ x1: x1, x2: x2, y1: y1, y2: y2 });
    }
  }, [objects, selectedObject]);
  // clear temporary points
  useEffect(() => {
    if (tool != "polygon") {
      setTempObjectPoints([]);
    }
    if (tool != "mirror") {
      setTempMirrorLinePoints([]);
    }
    if (tool != "select") {
      setSelectedObjectPoint(null);
      setSelectedObject("");
    }
  }, [tool]);
  // initial scroll
  useEffect(() => {
    if (scrollBox.current) {
      // console.log("scrollBox.current", scrollBox.current);
      const scrollLeft =
        ((x2 - x1) * zoomFactor * zoom) / 200 -
        scrollBox.current.clientWidth / 2;
      const scrollTop =
        ((y2 - y1) * zoomFactor * zoom) / 200 -
        scrollBox.current.clientHeight / 2;
      // console.log("scrollTop", scrollTop, "scrollLeft", scrollLeft);
      scrollBox.current.scrollTop = scrollTop;
      scrollBox.current.scrollLeft = scrollLeft;
    }
  }, []);
  // min zoom
  useEffect(() => {
    if(scrollBox.current){let height = scrollBox.current.clientHeight;
    let width = scrollBox.current.clientWidth;
    setMinZoom(
      Math.max(
        (height * 100) / ((y2 - y1) * zoomFactor),
        (width * 100) / ((x2 - x1) * zoomFactor)
      )
    );}
  }, [scrollBox]);

  const renderRipple = (x: number, y: number) => {
    return (
      <>
        <circle r={70 / zoom} cx={x} cy={y} opacity={0.5} fill="grey">
          <animate
            attributeName="r"
            begin="0s"
            dur="2s"
            from={10 / zoom}
            to={70 / zoom}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            begin="0s"
            dur="2s"
            from="1"
            to="0"
            repeatCount="indefinite"
          />
        </circle>
      </>
    );
  };
  const percentX = (x: number): number => {
    return ((x - x1) / (x2 - x1)) * 100;
  };

  const percentY = (y: number): number => {
    return ((y - y2) / (y1 - y2)) * 100;
  };

  const renderXticks = () => {
    const ticks = [];
    for (let i = x1; i <= x2; i++) {
      i != x1 &&
        i != x2 &&
        (zoom > 80 || i % 2 == 0) &&
        ticks.push(
          <text
            x={((i - x1) / (x2 - x1)) * 100}
            y={percentY(0)}
            fill="grey"
            key={`verticel-${i}`}
            dominantBaseline="text-before-edge"
            textAnchor="middle"
            fontSize={55 / zoom}
          >
            {i}
          </text>
        );
    }
    return ticks?.map((tick) => tick);
  };
  const renderYticks = () => {
    const ticks = [];
    for (let i = y1; i <= y2; i++) {
      i != y1 &&
        i != y2 &&
        i != 0 &&
        (zoom > 80 || i % 2 == 0) &&
        ticks.push(
          <text
            x={percentX(0)}
            y={((i - y2) / (y1 - y2)) * 100}
            style={{
              textAlign: "right",
              marginRight: "10px",
            }}
            fill="grey"
            fontSize={55 / zoom}
            key={`verticel-${i}`}
            alignmentBaseline="middle"
            textAnchor="end"
          >
            {i}
          </text>
        );
    }
    return ticks?.map((tick) => tick);
  };
  const renderVerticalLines = () => {
    const lines = [];
    for (let i = x1; i <= x2; i++) {
      i != x1 &&
        i != x2 &&
        lines.push(
          <line
            x1={((i - x1) / (x2 - x1)) * 100}
            y1={0}
            x2={((i - x1) / (x2 - x1)) * 100}
            y2={100}
            style={{
              stroke: "grey",
              strokeWidth: i == 0 ? 10 / zoom : 5 / zoom,
              strokeDasharray: i != 0 ? `${5 / zoom} ${5 / zoom}` : "none",
            }}
            key={`verticel-${i}`}
          />
        );
    }
    return lines?.map((line) => line);
  };
  const renderHorizontalLines = () => {
    const lines = [];
    for (let i = y1; i <= y2; i++) {
      i != y1 &&
        i != y2 &&
        lines.push(
          <line
            x1={0}
            y1={((i - y2) / (y1 - y2)) * 100}
            x2={100}
            y2={((i - y2) / (y1 - y2)) * 100}
            style={{
              stroke: "grey",
              strokeWidth: i == 0 ? 10 / zoom : 5 / zoom,
              strokeDasharray: i != 0 ? `${5 / zoom} ${5 / zoom}` : "none",
            }}
            key={`horizental-${i}`}
          />
        );
    }
    return lines?.map((line) => line);
  };
  const handleZoom1 = (z: number) => {
    let oldZoom = zoom;

    if (scrollBox.current) {
          let oldScrollX = scrollBox.current.scrollLeft;
    let oldScrollY = scrollBox.current.scrollTop;
      let focusX = oldScrollX + scrollBox.current.clientWidth / 2;
      let focusY = oldScrollY + scrollBox.current.clientHeight / 2;
      const scrollLeft =
        (focusX * z) / oldZoom - scrollBox.current.clientWidth / 2 || 0;
      const scrollTop =
        (focusY * z) / oldZoom - scrollBox.current.clientHeight / 2 || 0;
      scrollBox.current.scrollTop = scrollTop;
      scrollBox.current.scrollLeft = scrollLeft;
    }
    setZoom(z);
  };
  const handleZoom2 = (z: number, x: number, y: number) => {
    let oldZoom = zoom;
    if (scrollBox.current) {
      let oldScrollX = scrollBox.current.scrollLeft;
      let oldScrollY = scrollBox.current.scrollTop;
      let focusX = oldScrollX + x;
      let focusY = oldScrollY + y;
      // console.log("scrollBox.current", scrollBox.current);
      const scrollLeft =
        (focusX * z) / oldZoom - scrollBox.current.clientWidth / 2 || 0;
      const scrollTop =
        (focusY * z) / oldZoom - scrollBox.current.clientHeight / 2 || 0;
      // console.log("scrollTop", scrollTop, "scrollLeft", scrollLeft);
      scrollBox.current.scrollTop = scrollTop;
      scrollBox.current.scrollLeft = scrollLeft;
    }
    setZoom(z);
  };
  const handleMove = (e: any) => {
    if(graphBox.current){let rect = graphBox.current.getBoundingClientRect();
    let x =
      Math.round(
        ((e.clientX - rect.x) * (x2 - x1)) /
          (((x2 - x1) * zoomFactor * zoom) / 100)
      ) + x1;
    let y =
      Math.round(
        ((e.clientY - rect.height - rect.y) * (y1 - y2)) /
          (((y2 - y1) * zoomFactor * zoom) / 100)
      ) + y1;
    e = e.touches?.[0] || e;
    if (x > x1 && x < x2 && y > y1 && y < y2) {
      setHoveredPoint([x, y]);
      if (tool == "select") {
        if (
          Object.values(objects)
            .flat()
            .some((point) => point.join(",") === `${x},${y}`)
        ) {
          setHoveredObjectPoint([x, y]);
        } else {
          setHoveredObjectPoint(null);
        }
      }
    } else {
      setHoveredPoint(null);
    }}
  };

  const handleClick = (e: any) => {
    if(graphBox.current){let rect = graphBox.current.getBoundingClientRect();
    let x =
      Math.round(
        ((e.clientX - rect.x) * (x2 - x1)) /
          (((x2 - x1) * zoomFactor * zoom) / 100)
      ) + x1;
    let y =
      Math.round(
        ((e.clientY - rect.height - rect.y) * (y1 - y2)) /
          (((y2 - y1) * zoomFactor * zoom) / 100)
      ) + y1;
    e = e.touches?.[0] || e;
    if (x > x1 && x < x2 && y > y1 && y < y2) {
      if (tool == "polygon") {
        let temp = tempObjectPoints;
        // console.log(temp.length);
        // if(temp.length<=1){
        //   setObjectPoints([])
        // }
        if (temp.some((point) => point.join(",") === `${x},${y}`)) {
          if (tempObjectPoints.length <= 1) {
            setTempObjectPoints([]);
          } else {
            let id = Math.random().toString(36).slice(2, 7);
            while (Object.keys(objects).includes(id)) {
              id = Math.random().toString(36).slice(2, 7);
            }
            setObjects({ ...objects, [id]: [...tempObjectPoints] });
            setTempObjectPoints([]);
            console.log("includes");
          }
          // setTool("select")
        } else {
          console.log("not includes");
          setTempObjectPoints([...tempObjectPoints, [x, y]]);
        }
      } else if (tool == "mirror") {
        let temp: [number, number][] = tempMirrorLinePoints;
        // console.log(temp.length);
        if (temp.length == 0) {
          setTempMirrorLinePoints([[x, y]]);
        } else {
          setMirrorLinePoints([temp[0], [x, y]]);
          setTempMirrorLinePoints([]);
          // setTool("select")
        }
      } else if (tool == "rotCenter") {
        setCenterOfRotation([x, y]);
        // setTool("select")
      } else if (tool == "vector") {
        let temp = tempTransVector;
        if (temp?.length == 0) {
          setTempTransVector([[x, y]]);
        }
         else if(temp){
          setTransVector([temp[0], [x, y]]);
          setTempTransVector([]);
          // setTool("select")
        }
      } else if (tool == "select") {
        if (
          Object.values(objects)
            .flat()
            .some((point) => point.join(",") === `${x},${y}`)
        ) {
          setSelectedObjectPoint([x, y]);
          console.log("object removed");
          setSelectedObject("");
        } else {
          setSelectedObjectPoint(null);
          if (selectedObject &&!e.target.closest('.objects-polygons')) {
            console.log("no polygon");
            if (
              selectionCoordinates.x1 > x ||
              selectionCoordinates.x2 < x ||
              selectionCoordinates.y1 > y ||
              selectionCoordinates.y2 < y
            ) {
              setSelectedObject("");
            }
          }
        }
      } else if (tool == "enlargementCenter") {
        setCenterOfEnlargement([x, y]);
        // setTool("select")
      } else if (tool == "zoomIn" && zoom < 400) {
        handleZoom2(zoom + 10, e.clientX, e.clientY);
      } else if (tool == "zoomOut" && zoom > minZoom + 10) {
        handleZoom2(zoom - 10, e.clientX, e.clientY);
      }
    }}
  };
  const handleDelete = () => {
    if (selectedObject) {
      if (selectedObjectPoint) {
        if (
          objects[selectedObject].some(
            (point) =>
              point.join(",") ===
              `${selectedObjectPoint[0]},${selectedObjectPoint[1]}`
          )
        ) {
          setSelectedObjectPoint(null);
        }
      }
      let tempObjects = objects;
      delete tempObjects[selectedObject];
      setObjects({ ...tempObjects });
      setSelectedObject("");
    }
  };
  const renderScaleDescription = (f: number) => {
    if (f == 1) {
      return "Image has same size as object";
    } else if (f == 0) {
      return "Image is a point at the center of enlargement"
    }
    else if(f==-1){
      return "Image has same size as the object but it's inverted as the scale factor is negative";
    }
     else if (f >1) {
      return "Image is bigger than the object as magnitude of the scale factor is greater than 1";
    }
    else if (f >0) {
      return "Image is smaller than the object as magnitude of the scale factor is less than 1";
    }
    else if(f>-1){
      return "Image is smaller than the object as the scale factor has a magnitude less than 1. And it's inverted as the scale factor is negative";
    }
    else{
      return "Image is bigger than the object as the scale factor has a magnitude greater than 1. And it's inverted as the scale factor is negative";
    }
  }
  const coordPos=([x1,y1]:[number,number],[x2,y2]:[number,number])=>{
    if(x1===x2&&y1===y2){
      return [percentX(x1+1),percentY(y1+1)]
    }
    let coords=[percentX(x1+(x1-x2)/Math.sqrt((x1-x2)**2+(y1-y2)**2)),percentY(y1+(y1-y2)/Math.sqrt((x1-x2)**2+(y1-y2)**2))]
    console.log(coords);
    return coords
  }

  return (
    <>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "scroll",
          // scrollLeft: `${((x2 - x1) * zoomFactor * zoom) / 200}px`,
          // scrollTop: `${((y2 - y1) * zoomFactor * zoom) / 200}px`,
        }}
        ref={scrollBox}
      >
        <div
          id="graph-main"
          className="graph mx-auto bg-light select-none"
          style={{ aspectRatio: `${x2 - x1}/${y2 - y1}` }}
          ref={graphBox}
        >
          <div
            className="tools fixed flex flex-col justify-center items-start p-1"
            style={{ height: "100vh" }}
          >
            <button
              type="button"
              onClick={() => setTool("polygon")}
              className={`m-1 bg-[${
                tool == "polygon" ? color2 : color1
              }] text-white p-1 px-2 rounded`}
            >
              <i className="fa-solid fa-draw-polygon" title="Draw objects"></i>
            </button>
            <button
              type="button"
              onClick={() => setTool("select")}
              className={`m-1 bg-[${
                tool == "select" ? color2 : color1
              }] text-white p-1 px-2.5 rounded`}
              title="Select vertices to analyse transformation / select objects to delete"
            >
              <i className="fa-solid fa-arrow-pointer"></i>
            </button>
            <button
              type="button"
              onClick={()=>setShowDeletePrompt(true)}
              className={`m-1 bg-[${color1}] text-white p-1 px-2 rounded`}
              title="Delete all objects"
            >
              <i className="fa-solid fa-trash"></i>
            </button>
            <hr className="w-full" />
            <button
              type="button"
              onClick={() =>setShowCoords(!showCoords)}
              className={`m-1 bg-[${
                showCoords ? color2 : color1
              }] text-white p-1 px-0.5 rounded ${(!showCoords) &&'crossed'}`}
              title={`${showCoords ? "Hide" : "Show"} coordinates of selected vertex`}
            >
              (x,y)
            </button>
            {/* <button
              type="button"
              onClick={() => setShowAngle(!showAngle)}
              className={`m-1 bg-[${
                showAngle ? color2 : color1
              }] text-white p-1 px-2 rounded`}
              title="Zoom out"
            >
              θ°
            </button> */}
          </div>
          <div
            className="tools fixed flex flex-wrap justify-start items-start p-1"
            style={{ width: "100vw" }}
          >
            <select
              className={`p-1 mb-1 bg-white rounded border border-2 border-[${color1}] focus:border-[${color2}]`}
              onChange={(e) => {
                setTransformation(e.target.value);
                setTool("select");
              }}
            >
              <option value="reflection">Reflection</option>
              <option value="rotation">Rotation</option>
              <option value="translation">Translation</option>
              <option value="enlargement">Enlargement</option>
            </select>
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              className={`mx-1 bg-[${color1}] text-white p-1 px-3 rounded`}
              title={`What is ${transformation}?`}
            >
              <i className="fa-solid fa-info"></i>
            </button>

            {transformation == "reflection" && (
              <>
                <button
                  type="button"
                  onClick={() => setTool("mirror")}
                  className={`mx-1 bg-[${
                    tool == "mirror" ? color2 : color1
                  }] text-white p-1 px-2 rounded`}
                  title="Draw mirror line"
                >
                  <i className="fa-solid fa-slash"></i>
                </button>
                <p className={`mx-1 p-1 bg-white rounded border border-2 border-[${color1}]`}>
                  Reflection on the line{" "}
                  <span className="font-bold text-[#800080]">
                    {lineEquation(mirrorLinePoints)}
                  </span>
                </p>
              </>
            )}

            {transformation == "rotation" && (
              <>
                <div className="flex flex-col items-center relative">
                <span
                    className="absolute top-2 left-1 z-10 origin-[0] -translate-y-4 scale-75 transform cursor-text select-none bg-white px-2 text-sm text-gray-500 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-blue-600"
                  >
                    Direction
                  </span>
                  <div className="flex items-center justify-center mt-2 z-10">
                    <button
                      type="button"
                      onClick={() => setIsClockwise(false)}
                      className={`mx-0.5 p-0 px-2 rounded bg-[${
                        !isClockwise ? color2 : color1
                      }] text-white`}
                      title="Direction-Counterclockwise"
                    >
                      <i className="fa-solid fa-rotate-left fa-xs"></i>
                    </button>
    
                    <button
                      type="button"
                      onClick={() => setIsClockwise(true)}
                      className={`mx-0.5 p-0 px-2 rounded bg-[${
                        isClockwise ? color2 : color1
                      }] text-white`}
                      title="Direction-Clockwise"
                    >
                      <i className="fa-solid fa-rotate-right fa-xs"></i>
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTool("rotCenter")}
                  className={`mx-1 bg-[${
                    tool == "rotCenter" ? color2 : color1
                  }] text-white p-1 px-2 rounded`}
                  title="Mark center of rotation"
                >
                  <i className="fa-solid fa-circle"></i>
                </button>

                <div className="relative mt-2 w-50 flex">
                  <input
                    type="range"
                    onChange={(e) => {
                      setRotationAngle(Number(e.target.value));
                      setTool("select");
                    }}
                    value={rotationAngle}
                    min={0}
                    max={360}
                    id="angle-slider"
                    className="peer w-25"
                  />
                  <input
                    type="number"
                    onChange={(e) => {
                      if(Number(e.target.value)>360){setRotationAngle(360);}
                      else if(Number(e.target.value)<0){setRotationAngle(0);}
                      else{setRotationAngle(Number(e.target.value));}
                      setTool("select");
                    }}
                    value={rotationAngle}
                    min={0}
                    max={360}
                    id="angle-input"
                    className={`peer block w-15 p-1 bg-white rounded border border-2 border-[${color1}] focus:border-[${color2}] w-16 text-center`}
                    placeholder=" "
                  />
                  <label
                    className="absolute top-2 left-1 z-10 origin-[0] -translate-y-4 scale-75 transform cursor-text select-none bg-white px-2 text-sm text-gray-500 duration-300 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:px-2 peer-focus:text-blue-600"
                  >
                    {" "}
                    Rotation angle (deg){" "}
                  </label>
                  {/* <div className="absolute right-1 top-1/2 -translate-y-1/2 bg-white py-1 px-1 text-gray-300 peer-placeholder-shown:text-white peer-focus:text-gray-300">°</div> */}
                </div>
                <p className="mx-1 p-1 bg-white rounded border border-2 border-[${color1}]">
                  <span className="font-bold text-[#800080]">
                    {rotationAngle}°{" "}
                  </span>
                  rotation about the point{" "}
                  <span className="font-bold text-[#800080]">
                    ({centerOfRotation?.[0]}, {centerOfRotation?.[1]})
                  </span>{" "}
                  in{" "}
                  <span className="font-bold text-[#800080]">
                    {isClockwise ? "clockwise" : "counterclockwise"}
                  </span>{" "}
                  direction.
                </p>
              </>
            )}
            {transformation == "translation" && (
              <>
                <button
                  type="button"
                  onClick={() => setTool("vector")}
                  className={`mx-1 bg-[${
                    tool == "vector" ? color2 : color1
                  }] text-white p-1 px-3 rounded`}
                  title="Draw translation vector"
                >
                  <i
                    className="fa-solid fa-arrow-up-long fa-rotate-by"
                    style={{ "--fa-rotate-angle": "45deg" } as any}
                  />
                </button>
                <p className="m-0 mx-1 p-0 px-1 bg-white rounded border border-2 border-[${color1}]">
                  Translation by the vector{" "}
                  <div className="inline-flex text-[#800080] text-3xl p-0">
                    [
                    <div className="inline-flex flex-col text-sm justify-center">
                      <p className="p-0 m-0">
                        {transVector[1][0] - transVector[0][0]}
                      </p>
                      <p className="p-0 m-0">
                        {transVector[1][1] - transVector[0][1]}
                      </p>
                    </div>
                    ]
                  </div>
                </p>
              </>
            )}
            {transformation == "enlargement" && (
              <>
                <button
                  type="button"
                  onClick={() => setTool("enlargementCenter")}
                  className={`mx-1 bg-[${
                    tool == "enlargementCenter" ? color2 : color1
                  }] text-white p-1 px-2 rounded`}
                  title="Mark center of enlargement"
                >
                  <i className="fa-solid fa-circle"></i>
                </button>

                <div className="mt-0 w-50 flex">
                  <div className="peer w-25 flex flex-col">
                    <label
                      htmlFor="e-factor-input"
                      className="scale-75 select-none bg-white px-2 text-sm text-gray-500 my-0 text-center"
                    >
                      {" "}
                      Scale&nbsp;factor{" "}
                    </label>
                    <input
                      type="range"
                      onChange={(e) => {
                        if(Number(e.target.value)<-10){setEnlargementFactor(-10);}
                        else if(Number(e.target.value)>10){setEnlargementFactor(10);}
                        else{
                          setEnlargementFactor(Number(e.target.value));
                        }
                        setTool("select");
                      }}
                      value={enlargementFactor}
                      min={-10}
                      max={10}
                      id="e-factor-slider"
                      step={0.1}
                    />
                    <div className="w-75 flex justify-between my-0 text-gray-500 text-sm ">
                      <div className="color-gray">-10</div>
                      <div>0</div>
                      <div>10</div>
                    </div>
                  </div>

                  <input
                    type="number"
                    onChange={(e) => {
                      setEnlargementFactor(Number(e.target.value));
                      setTool("select");
                    }}
                    value={enlargementFactor}
                    min={-10}
                    max={10}
                    id="e-factor-input"
                    className={`peer block w-15 mx-1 bg-white rounded border border-2 border-[${color1}] focus:border-[${color2}] w-16 text-center h-11`}
                    placeholder=" "
                    step={0.1}
                  />
                </div>
                <p className="mx-1 p-2 bg-white rounded border border-2 border-[${color1}]">
                  {" "}
                  Enlargement w.r.t. the point{" "}
                  <span className="font-bold text-[#800080]">
                    ({centerOfEnlargement[0]}, {centerOfEnlargement[1]} )
                  </span>{" "}
                  by the factor{" "}
                  <span className="font-bold text-[#800080]">
                    {enlargementFactor}
                  </span>
                  . {renderScaleDescription(enlargementFactor)}
                </p>
              </>
            )}
          </div>
          <div className="tools fixed flex-col justify-center items-center bottom-4 right-9">
            <button
              type="button"
              onClick={() => setTool("zoomIn")}
              className={`m-1 bg-[${color1}]  text-white p-1 px-2 rounded block`}
            >
              <i className="fa-solid fa-magnifying-glass-plus" />
            </button>
            <button
              type="button"
              onClick={() => handleZoom1(100)}
              className={`m-1 bg-[${color1}]  text-white p-1 px-2 rounded block`}
            >
              <i className="fa-solid fa-magnifying-glass" />
            </button>
            <button
              type="button"
              onClick={() => setTool("zoomOut")}
              className={`m-1 bg-[${color1}] text-white p-1 px-2 rounded block`}
            >
              <i className="fa-solid fa-magnifying-glass-minus" />
            </button>
          </div>
          <input
            type="range"
            onChange={(e) => handleZoom1(Number(e.target.value))}
            value={zoom}
            min={minZoom}
            max={400}
            id="zoom-slider"
            className={`fixed bottom-1 right-0  border-[${color1}]`}
            style={{
              transformOrigin: "100% 0",
              transform: "rotate(-90deg) translate(100%, -150%)",
            }}
          />

          <div className="tools fixed justify-center items-center bottom-4 left-1">
            <button
              type="button"
              onClick={() => setShowHelp1(true)}
              className={`m-1 bg-[${color1}]  text-white p-1 px-2 rounded block`}
              title="Help"
            >
              <i className="fa-solid fa-question" />
            </button>
          </div>

          <svg
            height={((y2 - y1) * zoomFactor * zoom) / 100}
            width={((x2 - x1) * zoomFactor * zoom) / 100}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            onMouseMove={(e) => {
              handleMove(e);
            }}
            onTouchMove={(e) => {
              handleMove(e);
            }}
            onClick={(e) => {
              handleClick(e);
            }}
            onTouchEnd={(e) => {
              handleClick(e);
            }}
            // onTouchEnd={(e) => {
            //   handleClick(e);
            // }}
            className={`${tool == "polygon" && "cursor-cross-polygon"} ${
              tool == "mirror" && "cursor-cross-line"
            } ${tool == "delete" && "cursor-arrow-trash"} ${
              (tool == "rotCenter" || tool == "enlargementCenter") &&
              "cursor-cross-point"
            } ${tool == "vector" && "cursor-cross-vector"} ${
              tool == "zoomIn" && "cursor-zoom-in"
            } ${tool == "zoomOut" && "cursor-zoom-out"}`}
          >
            {renderVerticalLines()}
            {renderHorizontalLines()}
            {renderXticks()}
            {renderYticks()}
            <defs>
              <marker
                id="arrow"
                markerWidth="10"
                markerHeight="10"
                refX="5"
                refY="2.5"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path
                  d="M0,0 L5,2.5 L0,5"
                  fill="none"
                  stroke="grey"
                  strokeWidth="1"
                />
              </marker>
              <marker
                id="vector-arrow"
                markerWidth="5"
                markerHeight="5"
                refX="5"
                refY="2.5"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path
                  d="M0,0 L5,2.5 L0,5"
                  fill="none"
                  stroke="purple"
                  strokeWidth="1"
                />
              </marker>
              
              
              
            </defs>
            {(tool == "mirror" ||
              tool == "polygon" ||
              tool == "rotCenter" ||
              tool == "vector" ||
              tool == "enlargementCenter") &&
              hoveredPoint&&renderRipple(
                percentX(hoveredPoint[0]),
                percentY(hoveredPoint[1])
              )}
            {tool == "select" &&
              hoveredObjectPoint&&renderRipple(
                percentX(hoveredObjectPoint[0]),
                percentY(hoveredObjectPoint[1])
              )}

            {/* object  drawing*/}
            {tool === "polygon" && (
              <>
                <polyline
                  name="object-temp-lines"
                  points={tempObjectPoints
                    .map(
                      (coord) => `${percentX(coord[0])},${percentY(coord[1])}`
                    )
                    .join(" ")}
                  stroke={color1}
                  fill="none"
                  strokeWidth={10 / zoom}
                ></polyline>
                {tempObjectPoints.length > 0 &&hoveredPoint&& (
                  <line
                    name="object-temp-last-line"
                    x1={percentX(
                      tempObjectPoints?.[tempObjectPoints.length - 1]?.[0]
                    )}
                    y1={percentY(
                      tempObjectPoints?.[tempObjectPoints.length - 1]?.[1]
                    )}
                    x2={percentX(hoveredPoint[0])}
                    y2={percentY(hoveredPoint[1])}
                    stroke="lightgrey"
                    fill="none"
                    strokeWidth={10 / zoom}
                  ></line>
                )}
                {tempObjectPoints?.map((coord) => (
                  <circle
                    key={`temp-point-${coord[0]}-${coord[1]}`}
                    name="object-temp-points"
                    cx={percentX(coord[0])}
                    cy={percentY(coord[1])}
                    r={20 / zoom}
                    fill={color1}
                  />
                ))}
              </>
            )}


            {/* reflection */}
            {transformation == "reflection" && (
              <>
                {tempMirrorLinePoints.length == 1 &&hoveredPoint&&
                  renderLine(
                    percentX(tempMirrorLinePoints[0][0]),
                    percentY(tempMirrorLinePoints[0][1]),
                    percentX(hoveredPoint[0]),
                    percentY(hoveredPoint[1]),
                    0,
                    100,
                    0,
                    100,
                    `${color2}`,
                    10 / zoom,
                    `${10 / zoom} ${20 / zoom}`
                  )}
                {mirrorLinePoints.length > 1 &&
                  renderLine(
                    percentX(mirrorLinePoints[0][0]),
                    percentY(mirrorLinePoints[0][1]),
                    percentX(mirrorLinePoints[1][0]),
                    percentY(mirrorLinePoints[1][1]),
                    0,
                    100,
                    0,
                    100,
                    `purple`,
                    10 / zoom,
                    `${30 / zoom} ${15 / zoom}`
                  )}
                {tempMirrorLinePoints.length == 1 && hoveredPoint&&(
                  <>
                    <circle
                      name="temp-mirror-point-1"
                      cx={percentX(tempMirrorLinePoints[0][0])}
                      cy={percentY(tempMirrorLinePoints[0][1])}
                      r={25 / zoom}
                      fill="purple"
                    />
                    <circle
                      name="temp-mirror-point-2"
                      cx={percentX(hoveredPoint[0])}
                      cy={percentY(hoveredPoint[1])}
                      r={25 / zoom}
                      fill="purple"
                    />
                  </>
                )}
                {Object.keys(reflectImages).map((key) => (
                  <polygon
                    key={`reflection-${key}`}
                    name="reflections"
                    points={reflectImages?.[key]
                      ?.map(
                        (coord) => `${percentX(coord[0])},${percentY(coord[1])}`
                      )
                      .join(" ")}
                    stroke={color2}
                    fill={color2}
                    fillOpacity={0.5}
                    strokeWidth={15 / zoom}
                  ></polygon>
                ))}
              </>
            )}
            {/* rotation */}
            {transformation == "rotation" && (
              <>
                {centerOfRotation ? (
                  <circle
                    name="rotation-center"
                    cx={percentX(centerOfRotation[0])}
                    cy={percentY(centerOfRotation[1])}
                    r={30 / zoom}
                    fill={"purple"}
                  />
                ) : null}
                {Object.keys(rotatedImages).map((key) => (
                  <polygon
                    key={`rotation-${key}`}
                    name="rotations"
                    points={rotatedImages?.[key]
                      ?.map(
                        (coord) => `${percentX(coord[0])},${percentY(coord[1])}`
                      )
                      .join(" ")}
                    stroke={color2}
                    fill={color2}
                    fillOpacity={0.5}
                    strokeWidth={15 / zoom}
                  ></polygon>
                ))}
                {/* <polygon id="test" points={rotatedImages?.map(coord => `${percentX(coord[0])},${percentY(coord[1])}`).join(' ')} stroke={color2} fill={color2} fillOpacity={.5} strokeWidth={.3}></polygon> */}
              </>
            )}
            {/* translation */}
            {transformation == "translation" && (
              <>
                {transVector.length > 1 && (
                 <>
                    <line
                      name="trans-vector"
                      x1={percentX(transVector[0][0])}
                      y1={percentY(transVector[0][1])}
                      x2={percentX(transVector[1][0])}
                      y2={percentY(transVector[1][1])}
                      stroke="purple"
                      strokeWidth={15 / zoom}
                      strokeDasharray="none"
                      markerEnd="url(#vector-arrow)"
                    />
                    <line
                    name="trans-vector-X"
                    x1={percentX(transVector[0][0])}
                    y1={percentY(transVector[0][1])}
                    x2={percentX(transVector[1][0])}
                    y2={percentY(transVector[0][1])}
                    stroke="purple"
                    opacity={0.3}
                    strokeWidth={10 / zoom}
                    strokeDasharray="none"
                    markerEnd="url(#vector-arrow)"
                  />
                  <g id="trans-vector-x-label">
                    <rect x={percentX((transVector[0][0]+transVector[1][0])/2)} y={percentY(transVector[0][1])} width={80/zoom} height={80/zoom} fill="white" opacity={0.8} transform={`translate(${-40/zoom} ${-40/zoom})`} rx={30/zoom} ry={30/zoom}/>
                    <text x={percentX((transVector[0][0]+transVector[1][0])/2)} y={percentY(transVector[0][1])} fill="purple" fontSize={40/zoom} textAnchor="middle" alignmentBaseline="middle">{(transVector[1][0]-transVector[0][0])}</text>
                  </g>
                  <g id="trans-vector-y-label">
                    <rect x={percentX(transVector[1][0])} y={percentY((transVector[0][1]+transVector[1][1])/2)} width={80/zoom} height={80/zoom} fill="white" opacity={0.8} transform={`translate(${-40/zoom} ${-40/zoom})`} rx={30/zoom} ry={30/zoom}/>
                    <text  x={percentX(transVector[1][0])} y={percentY((transVector[0][1]+transVector[1][1])/2)} fill="purple" fontSize={40/zoom} textAnchor="middle" alignmentBaseline="middle">{Math.abs(transVector[1][1]-transVector[0][1])}</text>
                    </g>
                   <line
                      name="trans-vector-y"
                      x1={percentX(transVector[1][0])}
                      y1={percentY(transVector[0][1])}
                      x2={percentX(transVector[1][0])}
                      y2={percentY(transVector[1][1])}
                      stroke="purple"
                      opacity={0.3}
                      strokeWidth={10 / zoom}
                      strokeDasharray="none"
                      markerEnd="url(#vector-arrow)"
                    />

                 </>
                )}

                {tempTransVector?.length == 1 && (
                  <>
                    <circle
                      name="temp-trans-vector-point-1"
                      cx={percentX(tempTransVector[0][0])}
                      cy={percentY(tempTransVector[0][1])}
                      r={25 / zoom}
                      fill="purple"
                    />
                    {hoveredPoint&&<>
                      <circle
                        name="temp-trans-vector-point-2"
                        cx={percentX(hoveredPoint[0])}
                        cy={percentY(hoveredPoint[1])}
                        r={25 / zoom}
                        fill="purple"
                      />
                      <line
                        name="temp-trans-vector"
                        x1={percentX(tempTransVector[0][0])}
                        y1={percentY(tempTransVector[0][1])}
                        x2={percentX(hoveredPoint[0])}
                        y2={percentY(hoveredPoint[1])}
                        stroke={color2}
                        strokeWidth={10 / zoom}
                        strokeDasharray={`${10 / zoom} ${10 / zoom}`}
                      />
                    </>}
                  </>
                )}

                {Object.keys(transImages).map((key) => (
                  <polygon
                    key={`trans-${key}`}
                    name="translations"
                    points={transImages?.[key]
                      ?.map(
                        (coord) => `${percentX(coord[0])},${percentY(coord[1])}`
                      )
                      .join(" ")}
                    stroke={color2}
                    fill={color2}
                    fillOpacity={0.5}
                    strokeWidth={15 / zoom}
                  ></polygon>
                ))}
              </>
            )}
            {/* enlarge */}
            {transformation == "enlargement" && (
              <>
                {centerOfEnlargement && (
                  <circle
                    name="enlargement-center"
                    cx={percentX(centerOfEnlargement[0])}
                    cy={percentY(centerOfEnlargement[1])}
                    r={30 / zoom}
                    fill={"purple"}
                  />
                )}
                {Object.keys(enlargedImages).map((key) => (
                  <polygon
                    key={`enlargement-${key}`}
                    name="enlargements"
                    points={enlargedImages?.[key]
                      ?.map(
                        (coord) => `${percentX(coord[0])},${percentY(coord[1])}`
                      )
                      .join(" ")}
                    stroke={color2}
                    fill={color2}
                    fillOpacity={0.5}
                    strokeWidth={15 / zoom}
                  ></polygon>
                ))}
              </>
            )}
                        {/* objects */}
            {Object.keys(objects).map((key) => (
              <>
                <polygon
                  key={`object-${key}`}
                  name="objects"
                  className="objects-polygons"
                  points={objects?.[key]
                    ?.map(
                      (coord) => `${percentX(coord[0])},${percentY(coord[1])}`
                    )
                    .join(" ")}
                  stroke={color1}
                  fill={color1}
                  fillOpacity={0.5}
                  strokeWidth={15 / zoom}
                  onClick={() => {
                    tool == "select" && setSelectedObject(key);
                    // console.log("object selected");
                  }}
                ></polygon>
              </>
            ))}
            {/* selection  for delete*/}
            {selectedObject && (
              <g>
                <rect
                  name="selection-object"
                  x={percentX(selectionCoordinates.x1)}
                  height={
                    percentY(selectionCoordinates.y1) -
                    percentY(selectionCoordinates.y2)
                  }
                  y={percentY(selectionCoordinates.y2)}
                  width={
                    percentX(selectionCoordinates.x2) -
                    percentX(selectionCoordinates.x1)
                  }
                  stroke={color1}
                  fill="none"
                  strokeWidth={15 / zoom}
                  strokeDasharray={`${30 / zoom} ${15 / zoom}`}
                />
                <g onClick={handleDelete} className="cursor-pointer">
                  <rect
                    name="delete-box"
                    x={percentX(selectionCoordinates.x2) - 40 / zoom}
                    height={80 / zoom}
                    y={percentY(selectionCoordinates.y2) - 40 / zoom}
                    width={80 / zoom}
                    rx={30 / zoom}
                    ry={30 / zoom}
                    stroke={color1}
                    fill="white"
                    strokeWidth={10 / zoom}
                  ></rect>
                  <text
                    name="delete-text"
                    x={percentX(selectionCoordinates.x2)}
                    y={percentY(selectionCoordinates.y2)}
                    fill={color1}
                    fontSize={80 / zoom}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    x
                  </text>
                </g>
              </g>
            )}
            {/* point selection */}
            {selectedObjectPoint&&selectedObjectPoint.length > 0 &&
              transformation == "reflection" && (
                <g>
                  <circle
                    name="selected-object-point"
                    cx={percentX(selectedObjectPoint[0])}
                    cy={percentY(selectedObjectPoint[1])}
                    r={25 / zoom}
                    fill={color1}
                  />
                  <circle
                    name="reflected-object-point"
                    cx={percentX(
                      reflect(selectedObjectPoint, mirrorLinePoints)[0]
                    )}
                    cy={percentY(
                      reflect(selectedObjectPoint, mirrorLinePoints)[1]
                    )}
                    r={25 / zoom}
                    fill={color2}
                  />
                  <line
                    name="reflection-line"
                    x1={percentX(selectedObjectPoint[0])}
                    y1={percentY(selectedObjectPoint[1])}
                    x2={percentX(
                      reflect(selectedObjectPoint, mirrorLinePoints)[0]
                    )}
                    y2={percentY(
                      reflect(selectedObjectPoint, mirrorLinePoints)[1]
                    )}
                    stroke="grey"
                    strokeWidth={10 / zoom}
                    strokeDasharray="none"
                  />
                  {showCoords && (
                    <>
                    <text
                      name="selected-coordinates"
                      x={coordPos(selectedObjectPoint,reflect(selectedObjectPoint, mirrorLinePoints))[0]}
                        y={coordPos(selectedObjectPoint,reflect(selectedObjectPoint, mirrorLinePoints))[1]}
                      fill={'grey'}
                      fontSize={80 / zoom}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-outline"
                    >
                      {`(${Math.round(selectedObjectPoint[0]*10)/10},${Math.round(selectedObjectPoint[1]*10)/10})`}
                    </text>
                      <text
                        name="reflection-coordinates"
                        x={coordPos(reflect(selectedObjectPoint, mirrorLinePoints),selectedObjectPoint)[0]}
                        y={coordPos(reflect(selectedObjectPoint, mirrorLinePoints),selectedObjectPoint)[1]}
                        fill={'grey'}
                        fontSize={80 / zoom}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-outline"
                      >
                        {`(${Math.round(reflect(selectedObjectPoint, mirrorLinePoints)[0]*10)/10},${Math.round(reflect(selectedObjectPoint, mirrorLinePoints)[1]*10)/10})`}
                      </text>
                    </>
                  )}
                </g>
              )}
            {selectedObjectPoint&&selectedObjectPoint.length > 0 && transformation == "rotation" &&centerOfRotation&& (
              <g>
                <circle
                  name="selected-object-point"
                  cx={percentX(selectedObjectPoint[0])}
                  cy={percentY(selectedObjectPoint[1])}
                  r={25 / zoom}
                  fill={color1}
                />
                <circle
                  name="rotated-object-point"
                  cx={percentX(
                    rotate(
                      selectedObjectPoint,
                      centerOfRotation,
                      rotationAngle,
                      isClockwise
                    )[0]
                  )}
                  cy={percentY(
                    rotate(
                      selectedObjectPoint,
                      centerOfRotation,
                      rotationAngle,
                      isClockwise
                    )[1]
                  )}
                  r={25 / zoom}
                  fill={color2}
                />
                <line
                  name="rotation-line-1"
                  x1={percentX(selectedObjectPoint[0])}
                  y1={percentY(selectedObjectPoint[1])}
                  x2={percentX(centerOfRotation[0])}
                  y2={percentY(centerOfRotation[1])}
                  stroke="grey"
                  strokeWidth={10 / zoom}
                  strokeDasharray="none"
                />
                <line
                  name="rotation-line-2"
                  x1={percentX(
                    rotate(
                      selectedObjectPoint,
                      centerOfRotation,
                      rotationAngle,
                      isClockwise
                    )[0]
                  )}
                  y1={percentY(
                    rotate(
                      selectedObjectPoint,
                      centerOfRotation,
                      rotationAngle,
                      isClockwise
                    )[1]
                  )}
                  x2={percentX(centerOfRotation[0])}
                  y2={percentY(centerOfRotation[1])}
                  stroke="grey"
                  strokeWidth={10 / zoom}
                  strokeDasharray="none"
                />
                <path
                  name="roation-arc"
                  id="arc"
                  d={`M${percentX(
                    (selectedObjectPoint[0] + 2 * centerOfRotation[0]) / 3
                  )}
               ${percentY(
                 (selectedObjectPoint[1] + 2 * centerOfRotation[1]) / 3
               )} 
              A ${
                Math.sqrt(
                  (percentX(selectedObjectPoint[0]) -
                    percentX(centerOfRotation[0])) **
                    2 +
                    (percentY(selectedObjectPoint[1]) -
                      percentY(centerOfRotation[1])) **
                      2
                ) / 3
              }
               ${
                 Math.sqrt(
                   (percentX(selectedObjectPoint[0]) -
                     percentX(centerOfRotation[0])) **
                     2 +
                     (percentY(selectedObjectPoint[1]) -
                       percentY(centerOfRotation[1])) **
                       2
                 ) / 3
               }
                1 ${rotationAngle > 180 ? 1 : 0} ${isClockwise ? 1 : 0} 
                ${percentX(
                  (rotate(
                    selectedObjectPoint,
                    centerOfRotation,
                    rotationAngle,
                    isClockwise
                  )[0] +
                    2 * centerOfRotation[0]) /
                    3
                )} 
                ${percentY(
                  (rotate(
                    selectedObjectPoint,
                    centerOfRotation,
                    rotationAngle,
                    isClockwise
                  )[1] +
                    2 * centerOfRotation[1]) /
                    3
                )}`}
                  stroke="grey"
                  strokeWidth={10 / zoom}
                  strokeDasharray="none"
                  fill="none"
                  markerEnd={
                    (rotationAngle > 0 && rotationAngle < 360) ? "url(#arrow)" : ""
                  }
                  
                />
                {rotationAngle == 360 && (
                  <circle
                    name="full-rotation-circle"
                    cx={percentX(centerOfRotation[0])}
                    cy={percentY(centerOfRotation[1])}
                    r={
                      Math.sqrt(
                        (percentX(selectedObjectPoint[0]) -
                          percentX(centerOfRotation[0])) **
                          2 +
                          (percentY(selectedObjectPoint[1]) -
                            percentY(centerOfRotation[1])) **
                            2
                      ) / 3
                    }
                    fill="none"
                    stroke="grey"
                    strokeWidth={10 / zoom}
                  />
                )}
                <g id="angle-label">
                <rect x={percentX((rotate(selectedObjectPoint,centerOfRotation,rotationAngle/2, isClockwise)[0]+(2 * centerOfRotation[0])) / 3)-60/zoom} y={percentY((rotate(selectedObjectPoint,centerOfRotation,rotationAngle/2, isClockwise)[1]+(2 * centerOfRotation[1])) / 3)-40/zoom} width={120/zoom} height={80/zoom} fill="white" opacity={0.6} rx={50/zoom} ry={50/zoom} />
    <text x={percentX((rotate(selectedObjectPoint,centerOfRotation,rotationAngle/2, isClockwise)[0]+(2 * centerOfRotation[0])) / 3)} y={percentY((rotate(selectedObjectPoint,centerOfRotation,rotationAngle/2, isClockwise)[1]+(2 * centerOfRotation[1])) / 3)} fill="black" dominant-baseline="middle" alignmentBaseline="middle" text-anchor="middle" fontSize={40 / zoom}>{rotationAngle}°</text>
  </g>
                {showCoords && (
                    <>
                    <text
                      name="selected-coordinates"
                      x={coordPos(selectedObjectPoint,rotate(selectedObjectPoint, centerOfRotation, rotationAngle, isClockwise))[0]}
                        y={coordPos(selectedObjectPoint,rotate(selectedObjectPoint, centerOfRotation, rotationAngle, isClockwise))[1]}
                      fill={'grey'}
                      fontSize={80 / zoom}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-outline"
                    >
                      {`(${Math.round(selectedObjectPoint[0]*10)/10},${Math.round(selectedObjectPoint[1]*10)/10})`}
                    </text>
                      <text
                        name="rottated-coordinates"
                        x={coordPos(rotate(selectedObjectPoint, centerOfRotation, rotationAngle, isClockwise),selectedObjectPoint)[0]}
                        y={coordPos(rotate(selectedObjectPoint, centerOfRotation, rotationAngle, isClockwise),selectedObjectPoint)[1]}
                        fill={'grey'}
                        fontSize={80 / zoom}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-outline"
                      >
                        {`(${Math.round(rotate(selectedObjectPoint, centerOfRotation, rotationAngle, isClockwise)[0]*10)/10},${Math.round(rotate(selectedObjectPoint, centerOfRotation, rotationAngle, isClockwise)[1]*10)/10})`}
                      </text>
                    </>
                  )}
              </g>
            )}
            {selectedObjectPoint&&selectedObjectPoint.length > 0 &&
              transformation == "translation" && (
                <>
                  <circle
                    name="selected-object-point"
                    cx={percentX(selectedObjectPoint[0])}
                    cy={percentY(selectedObjectPoint[1])}
                    r={25 / zoom}
                    fill={color1}
                  />
                  <circle
                    name="translated-object-point"
                    cx={percentX(
                      translate(selectedObjectPoint, transVector)[0]
                    )}
                    cy={percentY(
                      translate(selectedObjectPoint, transVector)[1]
                    )}
                    r={25 / zoom}
                    fill={color2}
                  />
                  <line
                    name="translation-line"
                    x1={percentX(selectedObjectPoint[0])}
                    y1={percentY(selectedObjectPoint[1])}
                    x2={percentX(
                      translate(selectedObjectPoint, transVector)[0]
                    )}
                    y2={percentY(
                      translate(selectedObjectPoint, transVector)[1]
                    )}
                    stroke="grey"
                    strokeWidth={10 / zoom}
                    strokeDasharray="none"
                    markerEnd="url(#arrow)"
                  />
                  <line
                    name="translation-line-x"
                    x1={percentX(selectedObjectPoint[0])}
                    y1={percentY(selectedObjectPoint[1])}
                    x2={percentX(
                      translate(selectedObjectPoint, transVector)[0]
                    )}
                    y2={percentY(selectedObjectPoint[1])}
                    stroke="grey"
                    opacity={0.6}
                    strokeWidth={10 / zoom}
                    strokeDasharray="none"
                    markerEnd="url(#arrow)"
                  />
                  <line
                    name="translation-line-y"
                    x1={percentX(
                      translate(selectedObjectPoint, transVector)[0]
                    )}
                    y1={percentY(selectedObjectPoint[1])}
                    x2={percentX(
                      translate(selectedObjectPoint, transVector)[0]
                    )}
                    y2={percentY(
                      translate(selectedObjectPoint, transVector)[1]
                    )}
                    stroke="grey"
                    opacity={0.6}
                    strokeWidth={10 / zoom}
                    strokeDasharray="none"
                    markerEnd="url(#arrow)"
                  />
                  <g id="trans-line-x-label">
                    <rect x={percentX((selectedObjectPoint[0]+translate(selectedObjectPoint, transVector)[0])/2)} y={percentY(selectedObjectPoint[1])} width={80/zoom} height={80/zoom} fill="white" opacity={0.8} transform={`translate(${-40/zoom} ${-40/zoom})`} rx={30/zoom} ry={30/zoom}/>
                    <text x={percentX((selectedObjectPoint[0]+translate(selectedObjectPoint, transVector)[0])/2)} y={percentY(selectedObjectPoint[1])} fill="darkslategray" fontSize={40/zoom} textAnchor="middle" alignmentBaseline="middle">{(transVector[1][0]-transVector[0][0])}</text>
                  </g>
                  <g id="trans-line-y-label">
                    <rect x={percentX(translate(selectedObjectPoint, transVector)[0])}
                     y={percentY((selectedObjectPoint[1]+translate(selectedObjectPoint, transVector)[1])/2)} width={80/zoom} height={80/zoom} fill="white" opacity={0.8} transform={`translate(${-40/zoom} ${-40/zoom})`} rx={30/zoom} ry={30/zoom} />
                    <text  x={percentX(translate(selectedObjectPoint, transVector)[0])}
                     y={percentY((selectedObjectPoint[1]+translate(selectedObjectPoint, transVector)[1])/2)} fill="darkslategray" fontSize={40/zoom} textAnchor="middle" alignmentBaseline="middle">{Math.abs(transVector[1][1]-transVector[0][1])}</text>
                    </g>
                  {showCoords && (
                    <>
                    <text
                      name="selected-coordinates"
                      x={coordPos(selectedObjectPoint,translate(selectedObjectPoint, transVector))[0]}
                        y={coordPos(selectedObjectPoint,translate(selectedObjectPoint, transVector))[1]}
                      fill={'grey'}
                      fontSize={80 / zoom}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-outline"
                    >
                      {`(${Math.round(selectedObjectPoint[0]*10)/10},${Math.round(selectedObjectPoint[1]*10)/10})`}
                    </text>
                      <text
                        name="translated-coordinates"
                        x={coordPos(translate(selectedObjectPoint, transVector),selectedObjectPoint)[0]}
                        y={coordPos(translate(selectedObjectPoint, transVector),selectedObjectPoint)[1]}
                        fill={'grey'}
                        fontSize={80 / zoom}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-outline"
                      >
                        {`(${Math.round(translate(selectedObjectPoint, transVector)[0]*10)/10},${Math.round(translate(selectedObjectPoint, transVector)[1]*10)/10})`}
                      </text>
                    </>
                  )}
                </>
              )}
            {selectedObjectPoint&&selectedObjectPoint.length > 0 &&
              transformation == "enlargement" && (
                <>
                  <circle
                    name="selected-object-point"
                    cx={percentX(selectedObjectPoint[0])}
                    cy={percentY(selectedObjectPoint[1])}
                    r={25 / zoom}
                    fill={color1}
                  />
                  <circle
                    name="enlarged-object-point"
                    cx={percentX(
                      enlarge(
                        selectedObjectPoint,
                        centerOfEnlargement,
                        enlargementFactor
                      )[0]
                    )}
                    cy={percentY(
                      enlarge(
                        selectedObjectPoint,
                        centerOfEnlargement,
                        enlargementFactor
                      )[1]
                    )}
                    r={25 / zoom}
                    fill={color2}
                  />
                  <line
                    name="enlargement-line"
                    x1={percentX(selectedObjectPoint[0])}
                    y1={percentY(selectedObjectPoint[1])}
                    x2={percentX(
                      enlarge(
                        selectedObjectPoint,
                        centerOfEnlargement,
                        enlargementFactor
                      )[0]
                    )}
                    y2={percentY(
                      enlarge(
                        selectedObjectPoint,
                        centerOfEnlargement,
                        enlargementFactor
                      )[1]
                    )}
                    stroke="grey"
                    strokeWidth={10 / zoom}
                    strokeDasharray="none"
                    markerEnd="url(#arrow)"
                  />
                  <line
                    name="enlargement-line-dotted"
                    x1={percentX(selectedObjectPoint[0])}
                    y1={percentY(selectedObjectPoint[1])}
                    x2={percentX(centerOfEnlargement[0])}
                    y2={percentY(centerOfEnlargement[1])}
                    stroke="grey"
                    strokeWidth={10 / zoom}
                    strokeDasharray={`${20 / zoom} ${10 / zoom}`}
                  />
                  {showCoords && (
                    <>
                    <text
                      name="selected-coordinates"
                      x={coordPos(selectedObjectPoint,enlarge(selectedObjectPoint, centerOfEnlargement, enlargementFactor))[0]}
                        y={coordPos(selectedObjectPoint,enlarge(selectedObjectPoint, centerOfEnlargement, enlargementFactor))[1]}
                      fill={'grey'}
                      fontSize={80 / zoom}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-outline"
                    >
                      {`(${Math.round(selectedObjectPoint[0]*10)/10},${Math.round(selectedObjectPoint[1]*10)/10})`}
                    </text>
                      <text
                        name="enlarged-coordinates"
                        x={coordPos(enlarge(selectedObjectPoint, centerOfEnlargement, enlargementFactor),selectedObjectPoint)[0]}
                        y={coordPos(enlarge(selectedObjectPoint, centerOfEnlargement, enlargementFactor),selectedObjectPoint)[1]}
                        fill={'grey'}
                        fontSize={80 / zoom}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-outline"
                      >
                        {`(${Math.round(enlarge(selectedObjectPoint, centerOfEnlargement, enlargementFactor)[0]*10)/10},${Math.round(enlarge(selectedObjectPoint, centerOfEnlargement, enlargementFactor)[1]*10)/10})`}
                      </text>
                    </>
                  )}
                </>
              )}
          </svg>
        </div>
      </div>
 <>
        {showInfo &&
          transformation == "reflection" &&
          info.reflection(() => setShowInfo(false))}
        {showInfo &&
          transformation == "rotation" &&
          info.rotation(() => setShowInfo(false))}
        {showInfo &&
          transformation == "translation" &&
          info.translation(() => setShowInfo(false))}
        {showInfo &&
          transformation == "enlargement" &&
          info.enlargement(() => setShowInfo(false))}
  {showDeletePrompt&&info.delete(()=>setShowDeletePrompt(false),() => {
                  setObjects({});
                  setSelectedObjectPoint(null);
                  setSelectedObject("");
                })}
  
        {showHelp1 && (
          <Help
            helpFor={"general"}
            handleClose={() => {
              setShowHelp1(false);
              setShowHelp2(true);
            }}
            handleClose2={()=>{setShowHelp1(false)}}
          />
        )}
        {showHelp2 && transformation == "reflection" && (
          <Help helpFor={"reflection"} handleClose={() => setShowHelp2(false)} handleClose2={null}/>
        )}
        {showHelp2 && transformation == "rotation" && (
          <Help helpFor={"rotation"} handleClose={() => setShowHelp2(false)} handleClose2={null}/>
        )}
        {showHelp2 && transformation == "translation" && (
          <Help helpFor={"translation"} handleClose={() => setShowHelp2(false)} handleClose2={null}/>
        )}
        {showHelp2 && transformation == "enlargement" && (
          <Help helpFor={"enlargement"} handleClose={() => setShowHelp2(false)} handleClose2={null}/>
        )}
</> 

    </>
  );
}

export default Graph;
