import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import rough from 'roughjs'
import { getStroke } from 'perfect-freehand'
import { jsPDF } from "jspdf";
import { FaArrowPointer } from "react-icons/fa6";
import { IoRemoveOutline } from "react-icons/io5";
import { MdOutlineRectangle } from "react-icons/md";
import { IoEllipseOutline } from "react-icons/io5";
import { FaPencilAlt } from "react-icons/fa";
import { MdOutlineTextFields } from "react-icons/md";
import { LuUndo2 } from "react-icons/lu";
import { LuRedo2 } from "react-icons/lu";
import { FaRegSave } from "react-icons/fa";
import { FaDownload } from "react-icons/fa6";
import { HiMagnifyingGlassPlus } from "react-icons/hi2";
import { HiMagnifyingGlassMinus } from "react-icons/hi2";
import { SwatchesPicker } from 'react-color'
import { IoColorFill } from "react-icons/io5";
import { MdOutlineFormatColorFill } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";
import { IoHandRight } from "react-icons/io5";
import white from '../assets/white-back.png'

const generator = rough.generator()

const createElement = (id, x1, y1, x2, y2, tool, fillColor, fillStyle) => {

    let roughElement;

    switch (tool) {
        case 'line':
            roughElement = generator.line(x1, y1, x2, y2)
            return { id, x1, y1, x2, y2, roughElement, tool }
        case 'rectangle':
            roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1, { fill: fillColor, fillStyle: fillStyle })
            return { id, x1, y1, x2, y2, roughElement, tool, fillColor, fillStyle }
        case 'circle':
            const centerX = (x1 + x2) / 2;
            const centerY = (y1 + y2) / 2;
            const width = Math.abs(x2 - x1)
            const height = Math.abs(y2 - y1)
            roughElement = generator.ellipse(centerX, centerY, width, height, { fill: fillColor, fillStyle: fillStyle })
            return { id, x1, y1, x2, y2, roughElement, tool, fillColor, fillStyle }
        case 'pencil':
            return { id, tool, points: [{ x: x1, y: y1 }], fillColor }
        case 'text':
            return { id, x1, y1, x2, y2, tool, text: '', fillColor }
        default:
            throw new Error('Invalid tool')
    }

}

const nearPoint = (x, y, posX, posY, position) => {
    return Math.abs(x - posX) < 5 && Math.abs(y - posY) < 5 ? position : null
}

const online = (x, y, x1, y1, x2, y2, maxOffset) => {
    const p = { x: x1, y: y1 }
    const q = { x: x2, y: y2 }
    const r = { x, y }
    const offset = distance(p, q) - (distance(p, r) + distance(q, r))
    return Math.abs(offset) < maxOffset ? "inside" : null
}

const positionWithinElement = (x, y, element) => {
    const { x1, y1, x2, y2, tool } = element

    switch (tool) {
        case 'line':
            const on = online(x, y, x1, y1, x2, y2, 1)
            const start = nearPoint(x, y, x1, y1, "start")
            const end = nearPoint(x, y, x2, y2, "end")
            return start || end || on
        case 'rectangle':
            const topLeft = nearPoint(x, y, x1, y1, "tl")
            const topRight = nearPoint(x, y, x2, y1, "tr")
            const bottomLeft = nearPoint(x, y, x1, y2, "bl")
            const bottomRight = nearPoint(x, y, x2, y2, "br")
            const inside = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null
            return topRight || topLeft || bottomRight || bottomLeft || inside
        case 'circle':
            const centerX = (x1 + x2) / 2;
            const centerY = (y1 + y2) / 2;
            const a = Math.abs(x2 - x1) / 2
            const b = Math.abs(y2 - y1) / 2
            const check = (Math.pow((x - centerX), 2) / Math.pow(a, 2)) + (Math.pow((y - centerY), 2) / Math.pow(b, 2));
            const on_insidePath = check <= 1 ? "inside" : null
            const top = Math.abs(y - y1) < 5 ? "top" : null
            const bottom = Math.abs(y - y2) < 5 ? "bottom" : null
            const left = Math.abs(x - x1) < 5 ? "left" : null
            const right = Math.abs(x - x2) < 5 ? "right" : null
            return top || bottom || left || right || on_insidePath
        case 'pencil':
            const betweenAnyPoints = element.points.some((point, i) => {
                const nextPoint = element.points[i + 1]
                if (!nextPoint) return false
                return online(x, y, point.x, point.y, nextPoint.x, nextPoint.y, 5) !== null
            })
            const onPath = betweenAnyPoints ? "inside" : null
            return onPath
        case 'text':
            const text = x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null
            return text
        default:
            throw new Error('Invalid tool')
    }

}

const distance = (a, b) => {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

const getElementPosition = (x, y, elements) => {
    return elements
        .map(element => ({ ...element, pos: positionWithinElement(x, y, element) }))
        .find(element => element.pos !== null)
}

const adjustElementCoordinates = ({ x1, y1, x2, y2, tool }) => {
    if (tool === 'line') {
        if (x1 < x2 || y1 < y2) {
            return { x1, y1, x2, y2 }
        } else {
            return { x1: x2, y1: y2, x2: x1, y2: y1 }
        }
    } else {
        const minX = Math.min(x1, x2)
        const maxX = Math.max(x1, x2)
        const minY = Math.min(y1, y2)
        const maxY = Math.max(y1, y2)
        return { x1: minX, y1: minY, x2: maxX, y2: maxY }
    }
}

const cursorForPosition = (pos) => {
    switch (pos) {
        case 'start':
        case 'end':
            return 'crosshair'
        case 'tl':
        case 'br':
            return 'nwse-resize'
        case 'tr':
        case 'bl':
            return 'nesw-resize'
        case 'top':
        case 'bottom':
            return 'ns-resize'
        case 'left':
        case 'right':
            return 'ew-resize'
        default:
            return 'move'
    }

}

const resizeElementCoordinates = ({ coordinate, pos, clientX, clientY }) => {
    const { x1, y1, x2, y2 } = coordinate
    switch (pos) {
        case 'start':
            return { x1: clientX, y1: clientY, x2, y2 }
        case 'end':
            return { x1, y1, x2: clientX, y2: clientY }
        case 'tl':
            return { x1: clientX, y1: clientY, x2, y2 }
        case 'br':
            return { x1, y1, x2: clientX, y2: clientY }
        case 'tr':
            return { x1, y1: clientY, x2: clientX, y2 }
        case 'bl':
            return { x1: clientX, y1, x2, y2: clientY }
        case 'top':
            return { x1, y1: clientY, x2, y2 }
        case 'bottom':
            return { x1, y1, x2, y2: clientY }
        case 'left':
            return { x1: clientX, y1, x2, y2 }
        case 'right':
            return { x1, y1, x2: clientX, y2 }
        default:
            return null
    }
}

const useHistory = (initialState) => {
    const [history, setHistory] = useState([initialState])
    const [index, setIndex] = useState(0)
    const setState = (state, overwrite = false) => {
        const newState = typeof state === 'function' ? state(history[index]) : state
        if (overwrite) {
            const historyCopy = [...history]
            historyCopy[index] = newState
            setHistory(historyCopy)
        } else {
            const newHistory = history.slice(0, index + 1)
            setHistory([...newHistory, newState])
            setIndex(prevIndex => prevIndex + 1)
        }
    }

    const undo = () => index > 0 && setIndex(prevIndex => prevIndex - 1)
    const redo = () => index < history.length - 1 && setIndex(prevIndex => prevIndex + 1)

    return [history[index], setState, undo, redo]
}

const average = (a, b) => (a + b) / 2

function getSvgPathFromStroke(points, closed = true) {
    const len = points.length

    if (len < 4) {
        return ``
    }

    let a = points[0]
    let b = points[1]
    const c = points[2]

    let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(
        2
    )},${b[1].toFixed(2)} ${average(b[0], c[0]).toFixed(2)},${average(
        b[1],
        c[1]
    ).toFixed(2)} T`

    for (let i = 2, max = len - 1; i < max; i++) {
        a = points[i]
        b = points[i + 1]
        result += `${average(a[0], b[0]).toFixed(2)},${average(a[1], b[1]).toFixed(
            2
        )} `
    }

    if (closed) {
        result += 'Z'
    }

    return result
}


const drawElement = (rc, element, context) => {
    switch (element.tool) {
        case 'line':
        case 'rectangle':
        case 'circle':
            rc.draw(element.roughElement)
            break
        case 'pencil':
            const outlinePoints = getStroke(element.points, { size: 8 })
            const pathData = getSvgPathFromStroke(outlinePoints)
            const myPath = new Path2D(pathData)
            context.fillStyle = element.fillColor
            context.fill(myPath)
            break
        case 'text':
            context.font = '20px Tahoma'
            context.textBaseline = 'top'
            let lines = element.text.split('\n');
            const lineHeight = 20
            context.fillStyle = element.fillColor
            for (let i = 0; i < lines.length; i++) {
                context.fillText(lines[i], element.x1, element.y1 + (i * lineHeight))
            }
            break
        default:
            throw new Error('Invalid tool')
    }
}

const adjustmentRequired = (tool) => ['line', 'rectangle', 'circle'].includes(tool)

const WhiteBoard = ({ user, socket }) => {
    const [img, setImg] = useState(white)

    useEffect(() => {
        socket.on('canvas-data-res', (data) => {
            setImg(data.imgUrl)
        })
    }, [])




    const [action, setAction] = useState('none')
    const [elements, setElements, undo, redo] = useHistory([])
    const [tool, setTool] = useState('pencil')
    const [selectedElements, setSelectedElements] = useState(null)
    const inputRef = useRef()
    const [value, setValue] = useState('');
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
    const [startPan, setStartPan] = useState({ x: 0, y: 0 })
    const [scale, setScale] = useState(1)
    const [scaleOffset, setScaleOffset] = useState({ x: 0, y: 0 })
    const [a, setA] = useState([])
    const [fillColor, setFillColor] = useState('')
    const [isPickerVisible, setPickerVisible] = useState(false);
    const [dropDownVisible, setDropDownVisible] = useState(false);
    const [fillStyle, setFillStyle] = useState('');
    const [titleStyle, setTitleStyle] = useState('')
    const [reaction, setReaction] = useState('')


    useEffect(() => {
        if (reaction !== '') {
            socket.emit('reaction', reaction)
            setReaction('')
        }
    }, [reaction])

    useEffect(() => {
        if (action === 'writing') {
            setTimeout(() => {
                inputRef.current.focus();
                inputRef.current.value = selectedElements.text
            }, 0);
        }
    }, [selectedElements, action, fillColor])

    useEffect(() => {
        if (action === 'writing') {
            setTimeout(() => {
                inputRef.current.style.height = '0px';
                const { scrollHeight } = inputRef.current;
                inputRef.current.style.height = `${scrollHeight}px`;
            }, 0);
        }

    }, [inputRef, value, action, fillColor]);

    useEffect(() => {
        if (action === 'writing') {
            setTimeout(() => {
                inputRef.current.style.width = '2px';
                const { scrollWidth } = inputRef.current;
                inputRef.current.style.width = `${scrollWidth}px`;
            }, 0);
        }

    }, [inputRef, value, action, fillColor]);



    useEffect(() => {
        const undoRedoKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                redo();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                undo();
            }
        };

        document.addEventListener('keydown', undoRedoKeyDown)
        return () => document.removeEventListener('keydown', undoRedoKeyDown)

    }, [undo, redo]);

    useLayoutEffect(() => {
        const canvas = document.getElementById('canvas')
        if (canvas) {
            const context = canvas.getContext('2d')
            const rc = rough.canvas(canvas)
            context.clearRect(0, 0, canvas.width, canvas.height)

            const scaleWidth = canvas.width * scale
            const scaleHeight = canvas.height * scale

            const scaleOffsetX = (scaleWidth - canvas.width) / 2
            const scaleOffsetY = (scaleHeight - canvas.height) / 2
            setScaleOffset({ x: scaleOffsetX, y: scaleOffsetY })

            context.save()
            context.translate((panOffset.x * scale) - scaleOffsetX, (panOffset.y * scale) - scaleOffsetY)
            context.scale(scale, scale)

            elements.forEach((element) => {
                if (action === 'writing' && selectedElements.id === element.id) return
                drawElement(rc, element, context)
            })

            context.restore()

            const canvasImage = canvas.toDataURL()
            socket.emit('canvasData', canvasImage)
        }

    }, [elements, action, selectedElements, panOffset, scale])


    const getMouseCoordinates = (e) => {
        const clientX = (e.nativeEvent.offsetX - panOffset.x * scale + scaleOffset.x) / scale
        const clientY = (e.nativeEvent.offsetY - panOffset.y * scale + scaleOffset.y) / scale
        return { clientX, clientY }
    }

    const updatedElements = (id, x1, y1, clientX, clientY, tool, options) => {
        const elementsCopy = [...elements]
        switch (tool) {
            case 'line':
            case 'rectangle':
            case 'circle':
                elementsCopy[id] = createElement(id, x1, y1, clientX, clientY, tool, elementsCopy[id].fillColor, elementsCopy[id].fillStyle)
                break
            case 'pencil':
                elementsCopy[id].points = [...elementsCopy[id].points, { x: clientX, y: clientY }]
                break
            case 'text':
                const textWidth = document.getElementById('canvas').getContext('2d').measureText(options.text).width
                let lines = options.text.split('\n');
                const lineHeight = 20
                const textHeight = lines.length * lineHeight
                elementsCopy[id] = {
                    ...createElement(id, x1, y1, x1 + textWidth, y1 + textHeight, tool, elementsCopy[id].fillColor),
                    text: options.text
                }
                break
            default:
                throw new Error('Invalid tool')
        }
        setElements(elementsCopy, true)
    }


    const handleMouseDown = (e) => {

        setDropDownVisible(false)
        setPickerVisible(false)

        if (action === 'writing') return

        const { clientX, clientY } = getMouseCoordinates(e)
        if (e.button === 1) {
            setAction('panning')
            setStartPan({ x: clientX, y: clientY })
            return
        }

        if (tool === 'selection') {
            const element = getElementPosition(clientX, clientY, elements)
            if (element) {

                if (element.tool === 'pencil') {
                    const offsetX = element.points.map(point => clientX - point.x)
                    const offsetY = element.points.map(point => clientY - point.y)
                    setSelectedElements({ ...element, offsetX, offsetY })
                } else {
                    const offsetX = clientX - element.x1
                    const offsetY = clientY - element.y1
                    setSelectedElements({ ...element, offsetX, offsetY })
                }
                setElements(prevState => prevState)
                if (element.pos === 'inside') {
                    setAction('moving')
                } else {
                    setAction('resizing')
                }
            }
        } else {
            const id = elements.length
            const element = createElement(id, clientX, clientY, clientX, clientY, tool, fillColor, fillStyle)
            setElements((prevState) => [...prevState, element])
            if (tool === 'text') {
                setSelectedElements(element)
                setAction('writing')
            } else {
                setSelectedElements(element)
                setAction('drawing')
            }
        }
    }
    const handleMouseMove = (e) => {

        const { clientX, clientY } = getMouseCoordinates(e)

        if (action === 'panning') {
            const dx = clientX - startPan.x
            const dy = clientY - startPan.y
            setPanOffset(prevState => ({ x: dx + prevState.x, y: dy + prevState.y }))
            return
        }

        if (tool === 'selection') {
            const element = getElementPosition(clientX, clientY, elements)
            e.target.style.cursor = element ? cursorForPosition(element.pos) : 'default'
        }

        if (action === 'drawing') {
            const index = elements.length - 1
            const { x1, y1 } = elements[index]
            updatedElements(index, x1, y1, clientX, clientY, tool)
        } else if (action === 'moving') {

            if (selectedElements.tool === 'pencil') {
                const newPoints = selectedElements.points.map((_, i) => ({
                    x: clientX - selectedElements.offsetX[i],
                    y: clientY - selectedElements.offsetY[i]
                }))
                const elementsCopy = [...elements]
                elementsCopy[selectedElements.id] = {
                    ...elementsCopy[selectedElements.id],
                    points: newPoints
                }
                setElements(elementsCopy, true)
            } else {
                const { id, x1, y1, x2, y2, tool, offsetX, offsetY } = selectedElements
                const dx = x2 - x1
                const dy = y2 - y1
                const newX = clientX - offsetX
                const newY = clientY - offsetY
                const options = tool === 'text' ? { text: selectedElements.text } : {}
                updatedElements(id, newX, newY, newX + dx, newY + dy, tool, options)
            }
        } else if (action === 'resizing') {
            const { id, tool, pos, ...coordinate } = selectedElements
            const { x1, y1, x2, y2 } = resizeElementCoordinates({ coordinate, pos, clientX, clientY })
            updatedElements(id, x1, y1, x2, y2, tool)
        }
    }

    const handleMouseUp = (e) => {
        const { clientX, clientY } = getMouseCoordinates(e)

        if (selectedElements) {
            if (selectedElements.tool === 'text'
                && clientX - selectedElements.offsetX === selectedElements.x1
                && clientY - selectedElements.offsetY === selectedElements.y1) {
                setAction('writing')
                return
            }

            const index = selectedElements.id
            const { id, tool } = elements[index]
            if ((action === 'drawing' || action === 'resizing') && adjustmentRequired(tool)) {
                const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index])
                updatedElements(id, x1, y1, x2, y2, tool)
            }
        }

        if (action === 'writing') return



        setAction('none')
        setSelectedElements(null)
    }

    const handleBlur = (e) => {
        const { id, x1, y1, tool } = selectedElements;
        setAction("none");
        setSelectedElements(null);
        updatedElements(id, x1, y1, null, null, tool, { text: e.target.value }, fillColor)
    }

    const onZoom = (delta) => {
        setScale(prevState => Math.min(Math.max(prevState + delta, 0.1), 2))
    }

    const handleSave = () => {
        const canvas = document.getElementById('canvas');
        let imgData = canvas.toDataURL("image/png").replace('image/jpeg');
        setA(prevState => [...prevState, imgData])
    }

    const handleDownload = () => {

        let pdf = new jsPDF('landscape');
        for (let i = 0; i < a.length; i++) {
            if (i > 0) {
                pdf.addPage()
            }
            pdf.addImage(a[i], 'JPEG', 0, 0);

            if (a.length - 1 === i) {
                pdf.save("download.pdf");

            }
        }
    }

    const handleClear = () => {
        setElements([])
    }

    const handleRaiseHand = () => {
        socket.emit('raiseHand')
    }

    if (!user?.presenter) {

        return (
            <div>
                <div className='flex mb-1 '>
                    <div onClick={handleRaiseHand} className=' cursor-pointer border-2 rounded p-1 text-center mr-2 border-zinc-800 text-zinc-800 hover:bg-zinc-800 hover:text-white'>
                        <IoHandRight className='w-6 h-6' />
                    </div>
                    <div className='cursor-pointer border-2 rounded p-1 text-center mr-2 border-zinc-800 hover:bg-zinc-800 text-lg'
                        onClick={() => setReaction('😆')}
                    >
                        😆
                    </div>
                    <div className='cursor-pointer border-2 rounded p-1 text-center mr-2 border-zinc-800 hover:bg-zinc-800 text-lg'
                        onClick={() => setReaction('😍')}
                    >
                        😍
                    </div>
                    <div className='cursor-pointer border-2 rounded p-1 text-center mr-2 border-zinc-800 hover:bg-zinc-800 text-lg'
                        onClick={() => setReaction('😔')}
                    >
                        😔
                    </div>
                    <div className='cursor-pointer border-2 rounded p-1 text-center mr-2 border-zinc-800 hover:bg-zinc-800 text-lg'
                        onClick={() => setReaction('👌')}
                    >
                        👌

                    </div>
                    <div className='cursor-pointer border-2 rounded p-1 text-center mr-2 border-zinc-800 hover:bg-zinc-800 text-lg'
                        onClick={() => setReaction('👍')}
                    >
                        👍
                    </div>
                    <div className='cursor-pointer border-2 rounded p-1 text-center mr-2 border-zinc-800 hover:bg-zinc-800 text-lg'
                        onClick={() => setReaction('👎')}
                    >
                        👎
                    </div>
                </div>
                <div className='w-[58.82vw] h-[76.92vh] overflow-hidden border-2 border-gray-900 z-0 rounded-md shadow-md shadow-slate-700'>
                    <img
                        src={img}
                        alt=""
                        className='w-full h-full'
                    />
                </div>
            </div>
        )
    }



    return (
        <div>
            <div className='flex mb-1'>
                <input
                    type="radio"
                    id="selection"
                    name="drawing-type"
                    checked={tool === 'selection'}
                    onChange={() => setTool('selection')}
                    className='peer sr-only'
                />
                <label htmlFor="selection"
                    className={` ${tool === 'selection' ?
                        'text-white border-2 border-zinc-800 rounded p-1 text-center bg-zinc-800 mr-2' :
                        'text-zinc-800 border-2 border-zinc-800 rounded p-1 text-center mr-2'} cursor-pointer`}
                >
                    <FaArrowPointer className='h-5 w-5' />
                </label>
                <input
                    type="radio"
                    id="line"
                    name="drawing-type"
                    checked={tool === 'line'}
                    onChange={() => setTool('line')}
                    className='peer sr-only'
                />
                <label htmlFor="line"
                    className={` ${tool === 'line' ?
                        'text-white border-2 border-zinc-800 rounded p-1 text-center bg-zinc-800 mr-2' :
                        'text-zinc-800 border-2 border-zinc-800 rounded p-1 text-center mr-2'} cursor-pointer`}
                >
                    <IoRemoveOutline className='h-5 w-5' />
                </label>
                <input
                    type="radio"
                    id="rectangle"
                    name="drawing-type"
                    checked={tool === 'rectangle'}
                    onChange={() => setTool('rectangle')}
                    className='peer sr-only'
                />
                <label htmlFor="rectangle"
                    className={` ${tool === 'rectangle' ?
                        'text-white border-2 border-zinc-800 rounded p-1 text-center bg-zinc-800 mr-2' :
                        'text-zinc-800 border-2 border-zinc-800 rounded p-1 text-center mr-2'} cursor-pointer`}
                >
                    <MdOutlineRectangle className='h-5 w-5' />
                </label>
                <input
                    type="radio"
                    id="circle"
                    name="drawing-type"
                    checked={tool === 'circle'}
                    onChange={() => setTool('circle')}
                    className='peer sr-only'
                />
                <label htmlFor="circle"
                    className={` ${tool === 'circle' ?
                        'text-white border-2 border-zinc-800 rounded p-1 text-center bg-zinc-800 mr-2' :
                        'text-zinc-800 border-2 border-zinc-800 rounded p-1 text-center mr-2'} cursor-pointer`}
                >
                    <IoEllipseOutline className='h-5 w-5' />
                </label>
                <input
                    type="radio"
                    id="pencil"
                    name="drawing-type"
                    checked={tool === 'pencil'}
                    onChange={() => setTool('pencil')}
                    className='peer sr-only'
                />
                <label htmlFor="pencil"
                    className={` ${tool === 'pencil' ?
                        'text-white border-2 border-zinc-800 rounded p-1 text-center bg-zinc-800 mr-2' :
                        'text-zinc-800 border-2 border-zinc-800 rounded p-1 text-center mr-2'} cursor-pointer`}
                >
                    <FaPencilAlt className='h-5 w-5' />
                </label>
                <input
                    type="radio"
                    id="text"
                    name="drawing-type"
                    checked={tool === 'text'}
                    onChange={() => setTool('text')}
                    className='peer sr-only'
                />
                <label htmlFor="text"
                    className={` ${tool === 'text' ?
                        'text-white border-2 border-zinc-800 rounded p-1 text-center bg-zinc-800 mr-2' :
                        'text-zinc-800 border-2 border-zinc-800 rounded p-1 text-center mr-2'} cursor-pointer`}
                >
                    <MdOutlineTextFields className='h-5 w-5' />
                </label>
                <button
                    onClick={undo}
                    className='border-2 rounded p-1 text-center mr-2 border-zinc-800 text-zinc-800 hover:bg-zinc-800 hover:text-white'
                >
                    <LuUndo2 className='h-5 w-5' />
                </button>

                <button
                    onClick={redo}
                    className='border-2 rounded p-1 text-center mr-2 border-zinc-800 text-zinc-800 hover:bg-zinc-800 hover:text-white'
                >
                    <LuRedo2 className='h-5 w-5' />
                </button>
                <button
                    onClick={() => onZoom(0.1)}
                    className='border-2 rounded p-1 text-center mr-2 border-zinc-800 text-zinc-800 hover:bg-zinc-800 hover:text-white'
                >
                    <HiMagnifyingGlassPlus className='h-5 w-5' />
                </button>

                <span
                    onClick={() => setScale(1)}
                    className='mr-2 text-center text-lg'
                >{new Intl.NumberFormat('en-GB', { style: "percent" }).format(scale)}</span>
                <button
                    onClick={() => onZoom(-0.1)}
                    className='border-2 rounded p-1 text-center mr-2 border-zinc-800 text-zinc-800 hover:bg-zinc-800 hover:text-white'
                >
                    <HiMagnifyingGlassMinus className='h-5 w-5' />
                </button>
                <button
                    onClick={handleSave}
                    className='border-2 rounded p-1 text-center mr-2 border-zinc-800 text-zinc-800 hover:bg-zinc-800 hover:text-white'
                >
                    <FaRegSave className='h-5 w-5' />
                </button>
                {a.length !== 0 ? <button onClick={handleDownload}
                    className='border-2 rounded p-1 text-center mr-2 border-zinc-800 text-zinc-800 hover:bg-zinc-800 hover:text-white'
                >
                    <FaDownload className='h-5 w-5' />
                </button> : null}

                {
                    (tool === 'selection' || tool === 'line') ? null : (
                        <p onClick={() => { setPickerVisible(!isPickerVisible) }}
                            className='text-zinc-800 border-2 border-zinc-800 rounded p-1 text-center mr-2 cursor-pointer'
                            style={{ color: fillColor }}
                        >
                            {
                                (tool === 'text' || tool === 'pencil') ? <MdOutlineFormatColorFill className='h-5 w-5' /> : <IoColorFill className='h-5 w-5' />
                            }
                        </p>
                    )
                }

                {
                    (tool === 'rectangle' || tool === 'circle') ? (
                        <button
                            onClick={() => { setDropDownVisible(!dropDownVisible) }}
                            className={` ${dropDownVisible ?
                                'text-white border-2 border-zinc-800 rounded px-1 text-center bg-zinc-800 mr-2' :
                                'text-zinc-800 border-2 border-zinc-800 rounded px-1 text-center mr-2'}`}
                        >
                            {fillStyle !== '' ? titleStyle : 'Fill Style'}
                        </button>
                    ) : null
                }
                <button
                    onClick={handleClear}
                    className='border-2 rounded p-1 text-center mr-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white'
                >
                    <MdDeleteForever className='h-5 w-5' />
                </button>


            </div>
            <div className='w-[58.82vw] h-[76.92vh] relative' >
                <canvas
                    id='canvas'
                    width={window.innerWidth / 1.7}
                    height={window.innerHeight / 1.3}
                    className='border-2 border-gray-900 z-0 rounded-md shadow-md shadow-slate-700'
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                ></canvas>

                {isPickerVisible && (<SwatchesPicker
                    color={fillColor}
                    onChangeComplete={(fillColor) => setFillColor(fillColor.hex)}
                    className='absolute top-[0.5%] right-[15%] z-10'
                />)}
                {dropDownVisible && (
                    <div className='absolute top-0 right-[26%] rounded shadow py-2 z-10 bg-white'>
                        <ul>
                            <li
                                className={` hover:bg-slate-200 px-4 mb-1 cursor-pointer ${fillStyle === '' && 'bg-slate-200'}`}
                                onClick={() => {
                                    setFillStyle('')
                                    setTitleStyle('')
                                    setFillColor('')
                                }}
                            >None</li>
                            <li className={` hover:bg-slate-200 px-4 mb-1 cursor-pointer ${fillStyle === 'hachure' && 'bg-slate-200'}`}
                                onClick={() => {
                                    setFillStyle('hachure')
                                    setTitleStyle('Hachure')
                                }}
                            >Hachure</li>
                            <li className={` hover:bg-slate-200 px-4 mb-1 cursor-pointer ${fillStyle === 'solid' && 'bg-slate-200'}`}
                                onClick={() => {
                                    setFillStyle('solid')
                                    setTitleStyle('Solid')
                                }}
                            >Solid</li>
                            <li className={` hover:bg-slate-200 px-4 mb-1 cursor-pointer ${fillStyle === 'zigzag' && 'bg-slate-200'}`}
                                onClick={() => {
                                    setFillStyle('cross-hatch')
                                    setTitleStyle('Cross Hatch')
                                }}
                            >Cross Hatch</li>
                            <li className={` hover:bg-slate-200 px-4 mb-1 cursor-pointer ${fillStyle === 'dots' && 'bg-slate-200'}`}
                                onClick={() => {
                                    setFillStyle('dots')
                                    setTitleStyle('Dots')
                                }}
                            >Dots</li>
                        </ul>
                    </div>
                )}


                {action === 'writing' && (
                    <textarea
                        ref={inputRef}
                        style={{
                            top: (selectedElements.y1 - 2) * scale + panOffset.y * scale - scaleOffset.y,
                            left: (selectedElements.x1 + 2) * scale + panOffset.x * scale - scaleOffset.x,
                            position: 'absolute',
                            font: `${20 * scale}px Tahoma`,
                            margin: 0,
                            padding: 0,
                            border: 'none',
                            resize: 'auto',
                            outline: 'none',
                            background: 'transparent',
                            whiteSpace: 'pre',
                            overflow: 'hidden',
                            color: selectedElements.fillColor
                        }}
                        onBlur={handleBlur}
                        onChange={(e) => setValue(e.target.value)}
                    />
                )}
            </div>

        </div>
    )
}


export default WhiteBoard