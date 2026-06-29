import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HexGrid, Layout, Hexagon, GridGenerator, Text, HexUtils } from 'react-hexgrid';
import PropTypes from 'prop-types';

import './App.css';

const Profile = {
    CONE:       'Cone',
    SPIKE:      'Spike',
    DOME:       'Dome',
    FLAT:       'Flat'
};
const Profiles = Object.keys( Profile ).map( value => ({ value, label: Profile[ value ] }) );
const Area = {
    hexagon:                    'hexagon',
    // ring:                       'Ring', needs (hex,size) as args
    triangle:                   'triangle',
    // parallelogram:              'Parallelogram', needs ( q1, q2, r1, r2 ) as args
    rectangle:                  'rectangle',
    orientedRectangle:          'orientedRectangle'
};
const Areas = Object.keys( Area ).map( value => ({ value, label: Area[ value ] }) );

// these are the heights of the rings outside the central hex, so for size 0, there are no heights.
// the central hex is always pen size + 1.
const profileHeights = {
    CONE: [
        [],
        [ 1 ],
        [ 2, 1 ],
        [ 3, 2, 1 ],
        [ 4, 3, 2, 1 ],
        [ 5, 4, 3, 2, 1 ]
    ],
    SPIKE: [
        [],
        [ 1 ],
        [ 1, 1 ],
        [ 2, 1, 1 ],
        [ 3, 2, 1, 1 ],
        [ 3, 2, 1, 1, 1 ]
    ],
    DOME: [
        [],
        [ 2 ],
        [ 3, 2 ],
        [ 4, 3, 2 ],
        [ 5, 4, 4, 3 ],
        [ 6, 6, 5, 5, 3 ]
    ],
    FLAT: [
        [],
        [ 2 ],
        [ 3, 3 ],
        [ 4, 4, 4 ],
        [ 5, 5, 5, 5 ],
        [ 6, 6, 6, 6, 6 ]
    ]
};

function Button( props ) {
    const { label, onClick, fontSize = 16, padding = 8, disabled, className = '' } = props;

    return <div 
        className={`button flexRow ${disabled ? 'disabled' : ''} ${className}`}
        onClick={disabled ? null : onClick} 
        style={{ alignItems: 'center', justifyContent: 'center', fontSize, paddingTop: padding, paddingBottom: padding }}
    >
        <span className="material-symbols-outlined">{label}</span>
    </div>;
}
Button.propTypes = {
    label:      PropTypes.string.isRequired,
    onClick:    PropTypes.func.isRequired,
    fontSize:   PropTypes.number,
    padding:    PropTypes.number,
    disabled:   PropTypes.bool,
    className:  PropTypes.string
};

function NumberField( props ) {
    const { label, value, setValue, min, max, increment = 1 } = props;

    return <div className='flexRow border1' style={{ alignItems: 'center', paddingLeft: 8 }}>
        <span style={{ minWidth: 60 }}>{label}: {value}</span>

        <div className='flexColumn'>
            <Button 
                className='small'
                label='+' 
                fontSize={12} 
                padding={2} 
                onClick={() => setValue( value + increment )}
                disabled={max != null && value >= max}
            />
            <Button 
                className='small'
                label='-' 
                fontSize={12} 
                padding={2} 
                onClick={() => setValue( value - increment )}
                disabled={min != null && value <= min}
            />
        </div>
    </div>;
}
NumberField.propTypes = {
    label:      PropTypes.string.isRequired,
    value:      PropTypes.number.isRequired,
    setValue:   PropTypes.func.isRequired,
    min:        PropTypes.number,
    max:        PropTypes.number,
    increment:  PropTypes.number
};

function Switch( props ) {
    const { label, value, setValue } = props;

    return <div className='flexRow border1' style={{ alignItems: 'center', paddingLeft: 8, paddingRight: 8 }}>
        <span >{label}: {value}</span>

        <Button 
            className={`small ${value ? 'switchedOn' : ''}`}
            label={value ? '\u{2714}' : '\u{2800}'} 
            fontSize={12} 
            padding={2} 
            onClick={() => setValue( old => !old )}
        />
    </div>;
}
Switch.propTypes = {
    label:      PropTypes.string.isRequired,
    value:      PropTypes.number.isRequired,
    setValue:   PropTypes.func.isRequired,
    min:        PropTypes.number,
    max:        PropTypes.number,
    increment:  PropTypes.number
};

function Dropdown( props ) {
    const { label, value, options, onChange } = props;

    return <div className='flexColumn'>
        <div>{label}</div>
        <div style={{ flexGrow: 1 }}>
            <select name={label} id={label} value={value} onChange={e => onChange( e.target.value )}>
                {options.map( o => ( <option key={o.value} value={o.value}>{o.label}</option> ) )}
            </select>
        </div>
    </div>;
}
Dropdown.propTypes = {
    label:          PropTypes.string.isRequired,
    value:          PropTypes.string.isRequired,
    options:        PropTypes.array.isRequired,
    onChange:       PropTypes.func.isRequired
};

function SaveButton( props ) {
    const { filename, setFilename, getContent } = props;

    const handleDownload = () => {
        const data = getContent();
        const blob = new Blob([ data ], { type: 'text/plain' });
        const url = URL.createObjectURL( blob );
        const link = document.createElement( 'a' );
        link.href = url;
        link.download = /\.ht/.test( filename ) ? filename : `${filename}.ht`;
        link.click();
        URL.revokeObjectURL( url );
    };

    return <div>
        <input
            id='filename'
            value={filename}
            onChange={ e => setFilename( e.target.value )}
        />
        <button onClick={handleDownload} disabled={!( filename?.length )}>Save</button>
    </div>;
}
SaveButton.propTypes = {
    filename:       PropTypes.string.isRequired,
    setFilename:    PropTypes.func.isRequired,
    getContent:     PropTypes.func.isRequired
};

function LoadButton( props ) {
    const { value, onLoad } = props;

    let fileReader;

    const [ showInput, setShowInput ] = useState( false );
    const filenameRef = useRef( value );
  
    const handleFileRead = () => {
        const content = fileReader.result;
        onLoad( filenameRef.current, JSON.parse( content ) );
        setShowInput( false );
    };
  
    const handleFileChosen = file => {
        console.log( `file chosen`, filenameRef.current );
        fileReader = new FileReader();
        fileReader.onloadend = handleFileRead;
        fileReader.readAsText( file );
    };
  
    return <div onClick={() => setShowInput( true )} >
        Load
        {showInput &&
        <input
            type='file'
            id='file'
            className='input-file'
            accept='.ht'
            onChange={e => {
                filenameRef.current = e.target.files[ 0 ].name;
                handleFileChosen( e.target.files[ 0 ]);
            }}
        />}
    </div>;
}
LoadButton.propTypes = {
    value:          PropTypes.string.isRequired,
    onLoad:         PropTypes.func.isRequired
};

function axialToOddR( hex ) {
    const parity = hex.r & 1;
    const col = hex.q + ( hex.r - parity ) / 2;
    const row = hex.r;
    return [ col, row ];
}

function axialToEvenR( hex ) {
    const parity = hex.r & 1;
    const col = hex.q + ( hex.r + parity ) / 2;
    const row = hex.r;
    return [ col, row ];
}

function getCoordMins( rawCoords ) {
    let [ minCol, minRow ] = rawCoords[ 0 ];
    let minColRow = minRow;
    rawCoords.forEach( pair => {
        minCol = Math.min( minCol, pair[ 0 ]);
        if ( pair[ 0 ] < minCol )
        {
            minCol = pair[ 0 ];
            minColRow = pair[ 1 ];
        }
        minRow = Math.min( minRow, pair[ 1 ]);
    });
    return [ minCol, minRow, minColRow ];
}

function convertToHeights( hexagons, hexData ) {

    // the col/row coords will come in with negative values, if that's how the hex layout was done (quite likely).
    // we want to convert these to arrays so we need to know the min value for cols and rows, then we can adjust.

    let rawCoords = Object.values( hexagons ).map( hex => ([ ...axialToOddR( hex ), hex.data.key ]) );
    let [ minCol, minRow, minColRow ] = getCoordMins( rawCoords );

    // we converted using axialToOddR by default; if the minimum column falls on an odd row,
    // re-convert using axialToEvenR
    if ( !( ( minColRow - minRow ) & 1 ) )
    {
        rawCoords = Object.values( hexagons ).map( hex => ([ ...axialToEvenR( hex ), hex.data.key ]) );
        [ minCol, minRow ] = getCoordMins( rawCoords );
    }
    
    const rows = [];
    rawCoords.forEach( coord => {
        const [ col, row ] = [ coord[ 0 ] - minCol + ( ( coord[ 1 ] - minRow ) % 2 ? 0 : 1 ), coord[ 1 ] - minRow ];
        if ( !rows[ row ])
            rows[ row ] = [];
        rows[ row ][ col ] = hexData[ coord[ 2 ] ]?.height ?? 0;
    });

    // the longest row defines the sideLen and we have to send that many heights for each row, 
    // filling in missing cells with 0
    const sideLen = Math.max( ...rows.map( row => row.length ) );
    
    const heights = [];
    rows.forEach( ( row, r ) => {
        for ( let c = 0; c < sideLen; c++ ) 
            heights[ r * sideLen + c ] = row[ c ] ?? 0;
    });

    return { heights, sideLen };
}

const postRender = ( hexagons, hexData ) => {
    const url = "http://localhost:3001";
    const data = convertToHeights( hexagons, hexData );
    try {
        fetch( url, { 
            method:     'POST', 
            body:       JSON.stringify({ ...data }),
            headers: {
                "Content-Type": "application/json"
            }
        }).then( response => {
            if ( !response.ok ) 
                throw new Error( `Response status: ${response.status}` );
            response.json().then( result => {
                console.log( 'render:', result );
            });
        });
    } catch ( error ) {
        console.error( error.message );
    }
};

const changeHexHeight = ( hex, delta, increment ) => increment > 0

    // use the biggest possible newHeight, so the tip of a cone doesn't get wiped when we
    // move away and the trailing edge of the cone rolls over it
    ? hex?.newHeight != null
        ? Math.max( hex.newHeight, ( hex?.height ?? 0 ) + ( delta * increment ) )
        : ( hex?.height ?? 0 ) + ( delta * increment )
        
    // similarly, use the smallest possible newHeight but it's trickier because we can't default missing heights
    // to 0, because that will always be the min. If there's no existing height, new height is 0.
    : increment < 0 
        ? hex?.height 
            ? hex.newHeight != null
                ? Math.min( hex.newHeight, Math.max( 0, hex.height + ( delta * increment ) ) )
                : Math.max( 0, hex.height + ( delta * increment ) )
            : 0

        // ctrl sets the height without regard to the old height, just uses the pen size; best use for this is to set a flat area inside
        // established terrain, and then you can build on that with the same pen size but different profiles to produce a regular structure.
        : delta;

const makeKey = hex => `${hex.q}:${hex.r}:${hex.s}`;

const keyRegex = /([-0-9]+):([-0-9]+):([-0-9]+)/;
const unMakeKey = key => {
    const groups = keyRegex.exec( key );
    if ( !groups )
        throw new Error( `cannot unmake key ${key}` );
    return { q: Number( groups[ 1 ]), r: Number( groups[ 2 ]), s: Number( groups[ 3 ]) };
};

// Memoised hex cell — only re-renders when its own data changes.
// Receives pre-computed primitive props so React.memo's shallow compare works.
const HexCell = React.memo( function HexCell({
    hex, i, hexSize, showText,
    height, newHeight, pen, linePos,
    onMouseDown, onMouseUp, onMouseEnter, onMouseLeave
}) {
    const displayHeight = newHeight ?? height ?? 0;
    const fill = pen
        ? `rgb(${( 1 - pen ) * 100},${90 + ( 1 - pen ) * 100},${( 1 - pen ) * 100})`
        : linePos != null
            ? 'rgb(180, 104, 5)'
            : null;

    return (
        <Hexagon
            cellClassName={newHeight ? 'newHeight' : ''}
            key={i}
            q={hex.q}
            r={hex.r}
            s={hex.s}
            cellStyle={{
                fillOpacity:    1 - displayHeight * 0.05,
                fill
            }}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            data={{ ...hex.data }}
        >
            {showText && <>
                <Text
                    className='mainText'
                    style={{
                        fill:       ( height ?? 0 ) > 10 ? '#2d2dcf' : 'lightcyan',
                        fontSize:   hexSize * 0.4
                    }}
                >
                    {`${height ?? 0}-${newHeight ?? ''}`}
                </Text>
                <Text
                    y={hexSize / 2}
                    className='subtext'
                    style={{
                        fill:       ( height ?? 0 ) > 10 ? '#2d2dcf' : 'lightcyan',
                        fontSize:   hexSize * 0.4
                    }}
                >{hex.data.key}</Text>
            </>}
        </Hexagon>
    );
});
HexCell.propTypes = {
    hex:            PropTypes.object.isRequired,
    i:              PropTypes.number.isRequired,
    hexSize:        PropTypes.number.isRequired,
    showText:       PropTypes.bool.isRequired,
    height:         PropTypes.number,
    newHeight:      PropTypes.number,
    pen:            PropTypes.number,
    linePos:        PropTypes.number,
    onMouseDown:    PropTypes.func.isRequired,
    onMouseUp:      PropTypes.func.isRequired,
    onMouseEnter:   PropTypes.func.isRequired,
    onMouseLeave:   PropTypes.func.isRequired
};

// todo
// fill button
// change area shape
//      hexagon(size) - side length is size + 1
//      ring(hex, size) - ring is 1 hex wide
//      triangle(size) - side length is size + 1
//      parallelogram( q1, q2, r1, r2 ) -   horiz range is q1 to q2, vert range is r1 to r2; define as horiz x vert
//                                          and center around 0
//      rectangle( horiz, vert )        -   x/y aligned rectangle, even rows indented to right
//      orientedRectangle( horiz, vert ) -  rectangle whose vertical is aligned with r axis, ie running down to the right
// change tool profile ( cone/spike/dome ) 
// change tool power/impact
// (all the above refers to terrain shaping)
// structures; circles, lines, ?
// structures can have a different set of heights?

// eslint-disable-next-line max-statements
function App() {
    const [ currentHex, setCurrentHex ] = useState( null );

    const [ size, setSize ] = useState( 4 );
    const [ penSize, setPenSize ] = useState( 1 );
    const [ profile, setProfile ] = useState( Profiles[ 0 ].value );
    const [ area, setArea ] = useState( Areas[ 2 ].value );
    const [ heightLimit, setHeightLimit ] = useState( penSize + 1 );
    const [ widthLimit, setWidthLimit ] = useState( penSize );
    const [ hexSize, setHexSize ] = useState( 50 );
    const [ showText, setShowText ] = useState( true );
    const [ lineStart, setLineStart ] = useState( null );
    const [ draggedHexes, setDraggedHexes ] = useState( null );
    const [ increment, setIncrement ] = useState( null );
    const [ filename, setFilename ] = useState( '' );

    // --- Split state ---
    // hexData: persisted heights only { [key]: { height } }
    //   Changes only on mouse-up, undo, fill, clear, load.
    const [ hexData, setHexData ] = useState({});

    // penData: which cells are under the pen right now { [key]: penIntensity (0-1) }
    //   Changes on every mouse-move but only touches a small number of cells.
    const [ penData, setPenData ] = useState({});

    // newHeightData: preview heights during an active drag { [key]: newHeight }
    //   Changes during drag, cleared on mouse-up.
    const [ newHeightData, setNewHeightData ] = useState({});

    // lineData: line preview during alt-drag { [key]: linePos }
    //   Changes during alt-drag, cleared on mouse-up.
    const [ lineData, setLineData ] = useState({});

    const [ undoStack, setUndoStack ] = useState([ '{}' ]);

    const [ hexagons, setHexagons ] = useState(
        GridGenerator[ area ]( size, size ).map( hex => ({ ...hex, data: { key: makeKey( hex ) } }) )
    );

    const hexagonsRef = useRef( hexagons );

    const hexList = useMemo( () => {
        console.log( 'recalc hexList', hexagons.length );
        hexagonsRef.current = hexagons;
        return Object.values( hexagons );
    }, [ hexagons ]);

    // refs so mouse handlers can read current values without being re-created
    const penSizeRef       = useRef( penSize );
    const profileRef       = useRef( profile );
    const heightLimitRef   = useRef( heightLimit );
    const widthLimitRef    = useRef( widthLimit );
    const hexDataRef       = useRef( hexData );
    const incrementRef     = useRef( increment );
    const lineStartRef     = useRef( lineStart );
    const draggedHexesRef  = useRef( draggedHexes );

    useEffect( () => { penSizeRef.current      = penSize;      }, [ penSize ]);
    useEffect( () => { profileRef.current      = profile;      }, [ profile ]);
    useEffect( () => { heightLimitRef.current  = heightLimit;  }, [ heightLimit ]);
    useEffect( () => { widthLimitRef.current   = widthLimit;   }, [ widthLimit ]);
    useEffect( () => { hexDataRef.current      = hexData;      }, [ hexData ]);
    useEffect( () => { incrementRef.current    = increment;    }, [ increment ]);
    useEffect( () => { lineStartRef.current    = lineStart;    }, [ lineStart ]);
    useEffect( () => { draggedHexesRef.current = draggedHexes; }, [ draggedHexes ]);

    // --- Pen overlay (mouse-move only, no heights) ---

    const clearPens = useCallback( () => {
        setPenData({});
        setLineData({});
    }, []);

    // Compute which keys are in the pen area and their intensities.
    // Returns { [key]: intensity } for centre + rings.
    const computePenKeys = useCallback( hex => {
        const ps   = penSizeRef.current;
        const wl   = widthLimitRef.current;
        const result = { [ makeKey( hex ) ]: 1 };
        for ( let radius = 1; radius <= ps && radius <= wl; radius++ ) {
            const intensity = 1 - radius * ( 1 / ( ps + 1 ) );
            GridGenerator.ring( hex, radius ).forEach( h => {
                result[ makeKey( h ) ] = intensity;
            });
        }
        return result;
    }, []);

    // Update pen highlight only — called on every mouse-enter, no button pressed.
    const updatePenOverlay = useCallback( hex => {
        setPenData( computePenKeys( hex ) );
    }, [ computePenKeys ]);

    // Update line preview during alt-drag.
    const updateLineOverlay = useCallback( ( hex, lineStart ) => {
        const distance = HexUtils.distance( lineStart, hex );
        const step = 1.0 / Math.max( distance, 1 );
        const result = {};
        for ( let i = 0; i <= distance; i++ )
            result[ makeKey( HexUtils.round( HexUtils.hexLerp( lineStart, hex, step * i ) ) ) ] = i;
        setLineData( result );
        setPenData( computePenKeys( hex ) );
    }, [ computePenKeys ]);

    // --- New-height preview (during drag) ---

    const computeNewHeights = useCallback( ( hex, inc ) => {
        const ps   = penSizeRef.current;
        const wl   = widthLimitRef.current;
        const hl   = heightLimitRef.current;
        const prof = profileRef.current;
        const old  = hexDataRef.current;
        const newH = newHeightData; // current preview (carry-over for max/min logic)
        const ringHeights = profileHeights[ prof ][ ps ];

        const hexKey = makeKey( hex );
        const result = {
            [ hexKey ]: changeHexHeight(
                { height: old[ hexKey ]?.height, newHeight: newH[ hexKey ] },
                Math.min( ps + 1, hl ),
                inc
            )
        };
        for ( let radius = 1; radius <= ps && radius <= wl; radius++ ) {
            const delta = Math.min( ringHeights[ radius - 1 ], hl );
            GridGenerator.ring( hex, radius ).forEach( h => {
                const k = makeKey( h );
                result[ k ] = changeHexHeight(
                    { height: old[ k ]?.height, newHeight: newH[ k ] },
                    delta,
                    inc
                );
            });
        }
        return result;
    }, [ newHeightData ]);

    const applyNewHeights = useCallback( ( hex, inc ) => {
        setNewHeightData( prev => ({ ...prev, ...computeNewHeights( hex, inc ) }) );
    }, [ computeNewHeights ]);

    // --- Commit new heights to hexData on mouse-up ---

    const timerIdRef = useRef( null );
    const rafRef = useRef( null );

    const queueRender = useCallback( ( newHexData, skipUndo ) => {
        if ( timerIdRef.current )
            clearTimeout( timerIdRef.current );

        const newTimeoutID = setTimeout( () => {
            postRender( hexagonsRef.current, newHexData );

            if ( !skipUndo )
            {
                setUndoStack( old => {
                    const newUndoStack = Object.keys( newHexData ).length 
                        ? [ ...old, JSON.stringify( newHexData ) ] 
                        : [ '{}' ];
                    return newUndoStack;
                });
            }
            timerIdRef.current = null;
        }, 300 );

        timerIdRef.current = newTimeoutID;
    }, []);

    const commitNewHeights = useCallback( () => {
        const ps   = penSizeRef.current;
        const wl   = widthLimitRef.current;
        const hl   = heightLimitRef.current;
        const prof = profileRef.current;
        const inc  = incrementRef.current;
        const ls   = lineStartRef.current;
        const ringHeights = profileHeights[ prof ][ ps ];

        setHexData( old => {
            let newObjects;

            if ( ls ) {
                // Line mode: resolve line + pen-width heights from lineData
                const lineKeys = Object.keys( lineData );
                const allKeys = GridGenerator[ area ]( size, size ).map( hex => makeKey( hex ) );

                newObjects = allKeys.reduce( ( acc, cur ) => {
                    let lineHeight;
                    if ( lineKeys.includes( cur ) ) 
                        lineHeight = ps + 1;
                    else {
                        const curHex = unMakeKey( cur );
                        const closestLineKey = lineKeys.reduce( ( closest, key ) => {
                            const d = HexUtils.distance( unMakeKey( key ), curHex );
                            return ( d < closest.d ) ? { d, key } : closest;
                        }, { d: 100000 });

                        if ( closestLineKey.d <= Math.min( ringHeights.length, wl ) )
                            lineHeight = ringHeights[ closestLineKey.d - 1 ];
                    }

                    if ( lineHeight )
                        lineHeight = Math.max( 0, ( old[ cur ]?.height ?? 0 ) + Math.min( hl, lineHeight ) * inc );

                    return {
                        ...acc,
                        [ cur ]: {
                            height: lineHeight ?? old[ cur ]?.height ?? 0
                        }
                    };
                }, {});
            } else {
                // Normal drag: merge newHeightData into heights
                newObjects = { ...old };
                Object.entries( newHeightData ).forEach( ([ key, nh ]) => {
                    if ( nh != null )
                        newObjects[ key ] = { height: nh };
                });
            }

            queueRender( newObjects );
            return newObjects;
        });

        setNewHeightData({});
        setLineData({});
    }, [ area, size, lineData, newHeightData, queueRender ]);

    // --- Fill ---

    const fill = useCallback( () => {
        setHexData( old => {
            const newObjects = hexagons.reduce( ( acc, hex ) => {
                const k = hex.data.key;
                return { ...acc, [ k ]: { height: ( old[ k ]?.height ?? 0 ) + 1 } };
            }, { ...old });
            queueRender( newObjects );
            return newObjects;
        });
    }, [ hexagons, queueRender ]);

    // --- Clear / Undo ---

    const clearData = useCallback( () => {
        console.log( 'clear' );
        setHexData({});
        setNewHeightData({});
        setPenData({});
        setLineData({});
        queueRender({});
        setFilename( '' );
    }, [ queueRender ]);

    const undo = useCallback( () => {
        if ( undoStack.length > 1 )
        {
            setUndoStack( old => {
                const json = old[ old.length - 2 ];
                const previous = JSON.parse( json );
                setHexData( previous );
                queueRender( previous, true );
                return [ ...old.slice( 0, old.length - 1 ) ];
            });
        }
    }, [ undoStack, queueRender ]);

    // --- Mouse handlers ---

    const doMouseDown = useCallback( e => {
        const inc = e.shiftKey ? -1 : e.ctrlKey ? 0 : 1;
        const ls  = e.altKey ? currentHex.state.hex : null;

        setDraggedHexes([ currentHex.data.key ]);
        setIncrement( inc );
        setLineStart( ls );
        incrementRef.current = inc;
        lineStartRef.current = ls;

        if ( ls ) 
            updateLineOverlay( currentHex.state.hex, ls );
        else 
            applyNewHeights( currentHex.state.hex, inc );
        
    }, [ currentHex, applyNewHeights, updateLineOverlay ]);

    const doMouseUp = useCallback( () => {
        if ( draggedHexesRef.current )
        {
            commitNewHeights();
            setDraggedHexes( null );
            setIncrement( null );
            setLineStart( null );
            incrementRef.current = null;
            lineStartRef.current = null;
        }
    }, [ commitNewHeights ]);

    const doMouseEnter = useCallback( ( e, h ) => {
        // Cancel any frame that hasn't fired yet — we only want the latest hex.
        if ( rafRef.current )
            cancelAnimationFrame( rafRef.current );

        rafRef.current = requestAnimationFrame( () => {
            rafRef.current = null;

            setCurrentHex({ ...h });

            const inc = incrementRef.current;
            const ls  = lineStartRef.current;
            const dragging = draggedHexesRef.current;

            if ( dragging )
                draggedHexesRef.current.push( h.data.key );

            if ( ls ) 
                updateLineOverlay( h.state.hex, ls );
            else if ( dragging && inc != null ) {
                // Dragging without line mode: update pen overlay + new heights
                updatePenOverlay( h.state.hex );
                applyNewHeights( h.state.hex, inc );
            } else {
                // Just hovering: only update the pen highlight
                updatePenOverlay( h.state.hex );
            }
        });
    }, [ updatePenOverlay, updateLineOverlay, applyNewHeights ]);

    const doMouseLeave = useCallback( () => {
        if ( rafRef.current ) {
            cancelAnimationFrame( rafRef.current );
            rafRef.current = null;
        }
        clearPens();
    }, [ clearPens ]);

    useEffect( () => {
        const keyDownHandler = event => {
            if ( event.key === 'z' && event.ctrlKey ) {
                event.preventDefault();
                undo();
            }
        };
        document.addEventListener( 'keydown', keyDownHandler );
        return () => document.removeEventListener( 'keydown', keyDownHandler );
    }, [ undo ]);

    return (
        <div className="App" >
            <div className='flexRow' style={{ padding: 4 }}>
                <SaveButton 
                    filename={filename} 
                    setFilename={setFilename} 
                    getContent={() => JSON.stringify({
                        hexData,
                        penSize,
                        area,
                        hexSize,
                        size,
                        profile,
                        heightLimit,
                        widthLimit,
                        showText
                    }, undefined, 4 )}
                />
                <LoadButton value={filename} onLoad={ ( file, data ) => {
                    console.log( `file loaded`, { file, data });
                    setFilename( file );
                    setHexData( data.hexData );
                    setPenSize( data.penSize );
                    setArea( data.area );
                    setHexSize( data.hexSize );
                    setSize( data.size );
                    setProfile( data.profile );
                    setHeightLimit( data.heightLimit );
                    setWidthLimit( data.widthLimit );
                    setShowText( data.showText );
                    setNewHeightData({});
                    setPenData({});
                    setLineData({});
                    setHexagons( GridGenerator[ data.area ]( data.size, data.size ).map( hex => ({ ...hex, data: { key: makeKey( hex ) } }) ) );
                    queueRender( data.hexData );
                }} />
                <Button label="brush" onClick={() => queueRender( hexData )}/>
                <Button label="Clear" onClick={clearData}/>
                <Button label="exposure_plus_1" onClick={fill}/>
                <Button label="undo" onClick={undo} disabled={undoStack.length <= 1}/>
                <NumberField label={"Size"} value={size} setValue={newValue => {
                    setSize( newValue );
                    setHexagons( GridGenerator[ area ]( newValue, newValue ).map( hex => ({ ...hex, data: { key: makeKey( hex ) } }) ) );
                }} min={1}/>
                <NumberField label={"Hex Size"} value={hexSize} setValue={setHexSize} min={10} increment={5}/>
                <NumberField label={"Pen"} value={penSize} max={5} setValue={newValue => {
                    setPenSize( newValue );
                    setHeightLimit( newValue + 1 );
                    setWidthLimit( newValue );
                }} min={0}/>
                <Dropdown label="Pen Profile" options={Profiles} value={profile} onChange={setProfile} />
                <Dropdown label="Area Shape" options={Areas} value={area} onChange={newArea => {
                    setArea( newArea );
                    setHexagons( GridGenerator[ newArea ]( size, size ).map( hex => ({ ...hex, data: { key: makeKey( hex ) } }) ) );
                }} />
                <NumberField label={"H Limit"} value={heightLimit} setValue={setHeightLimit} min={1} max={penSize + 1}/>
                <NumberField label={"W Limit"} value={widthLimit} setValue={setWidthLimit} min={0} max={penSize}/>
                <Switch label={"Text"} value={showText} setValue={setShowText} />
            </div>
            <HexGrid 
                width={window.innerWidth * 0.9} 
                height={window.innerHeight * 0.8} 
                viewBox={`${area === Area.hexagon ? -window.innerWidth / 2 : 0} ` +
                    `${area === Area.hexagon ? -window.innerHeight / 2 : area === Area.orientedRectangle ? -window.innerHeight * 0.4 : -100} ` +
                    `${window.innerWidth} ${window.innerHeight}`}
                className='hexgrid'
            >
                <Layout size={{ x: hexSize, y: hexSize }} flat={false} space={0} spacing={1.01}>
                    {hexList.map( ( hex, i ) => (
                        <HexCell
                            key={i}
                            hex={hex}
                            i={i}
                            hexSize={hexSize}
                            showText={showText}
                            height={hexData[ hex.data.key ]?.height ?? 0}
                            newHeight={newHeightData[ hex.data.key ] ?? null}
                            pen={penData[ hex.data.key ] ?? null}
                            linePos={lineData[ hex.data.key ] ?? null}
                            onMouseDown={doMouseDown}
                            onMouseUp={doMouseUp}
                            onMouseEnter={doMouseEnter}
                            onMouseLeave={doMouseLeave}
                        />
                    ) )}
                </Layout>
            </HexGrid>
        </div>
    );
}

export default App;
