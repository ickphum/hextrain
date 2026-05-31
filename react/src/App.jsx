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

    console.log( `savebutton filename`, filename );

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
        // console.log( content );
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
                // setFilename( e.target.files[ 0 ].name );
                filenameRef.current = e.target.files[ 0 ].name;
                handleFileChosen( e.target.files[ 0 ]);
            }}
        />}
    </div>;
};
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
    // console.log( 'rawCoords', rawCoords );
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
    // console.log( 'convertToHeights', hexagons.length, Object.keys( hexData ).length );

    // if ( Object.keys( hexData ).length === 0 )
    //     undoStack.splice( 0, undoStack.length );
    // else
    //     undoStack.push( JSON.stringify( hexData ) );

    // the col/row coords will come in with negative values, if that's how the hex layout was done (quite likely).
    // we want to convert these to arrays so we need to know the min value for cols and rows, then we can adjust.

    let rawCoords = Object.values( hexagons ).map( hex => ([ ...axialToOddR( hex ), hex.data.key ]) );
    let [ minCol, minRow, minColRow ] = getCoordMins( rawCoords );

    // we converted using axialToOddR by default; if the minimum column falls on an odd row,
    // re-convert using axialToEvenR
    // console.log( 'initial minColRow', minColRow - minRow, ( minColRow - minRow ) & 1 );
    if ( !( ( minColRow - minRow ) & 1 ) )
    {
        // console.log( 'recalc' );
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
    // console.log( 'heights', rows );

    // the longest row defines the sideLen and we have to send that many heights for each row, 
    // filling in missing cells with 0
    const sideLen = Math.max( ...rows.map( row => row.length ) );
    // console.log( 'sideLen', sideLen );
    
    const heights = [];
    rows.forEach( ( row, r ) => {
        for ( let c = 0; c < sideLen; c++ ) 
            heights[ r * sideLen + c ] = row[ c ] ?? 0;
        
    });
    // console.log('heights', heights );

    // Object.values( hexagons ).forEach( hex => {
    //     const coords = axialToOddR( hex );
    //     console.log('hex', hex, axialToOddR( hex ) );
    // })
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
// (all the above refers to terrain shaping)`
// structures; circles, lines, ?
// structures can have a different set of heights?

function App() {
    const [ currentHex, setCurrentHex ] = useState( null );

    // { q:0, r:0, s:0 }
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
    const [ hexData, setHexData ] = useState({});
    const [ undoStack, setUndoStack ] = useState([ '{}' ]);
    const [ filename, setFilename ] = useState( '' );

    const [ hexagons, setHexagons ] = useState( GridGenerator[ area ]( size, size ).map( hex => ({ ...hex, data: { key: makeKey( hex ) } }) ) );

    const hexagonsRef = useRef( hexagons );

    const hexList = useMemo( () => {
        console.log( 'recalc hexList', hexagons.length );
        hexagonsRef.current = hexagons;
        return Object.values( hexagons );
    }, [ hexagons ]);


    const clearPens = useCallback( () => {
        setHexData( old => {

            // remove the pen and line position from every hex
            const oldObjects = Object.keys( old ).reduce( ( acc, cur ) => ({
                ...acc, 
                [ cur ]: { 
                    ...( old[ cur  ] ?? {}), 
                    pen:        0,
                    linePos:    null
                } }), {});

            const newHexData = { ...oldObjects };
            return newHexData;
        });

    }, [ hexData ]);

    const applyPen = useCallback( ( hex, old, newObjects, increment ) => {
        // console.log( 'applyPen', hex );
        const ringHeights = profileHeights[ profile ][ penSize ];
        // console.log( 'ringHeights', ringHeights );

        for ( let radius = 1; radius <= penSize && radius <= widthLimit; radius++ ) {
            const ringKeys = GridGenerator.ring( hex, radius )
                .map( makeKey );
            newObjects = ringKeys.reduce( ( acc, cur ) => ({ 
                ...acc, 
                [ cur ]: { 
                    ...( old[ cur  ] ?? {}), 
                    pen:            1 - radius * ( 1 / ( penSize + 1 ) ),
                    newHeight:      increment != null
                        ? changeHexHeight( old[ cur ], Math.min( ringHeights[ radius - 1 ], heightLimit ), increment ) 
                        : null

                } }), newObjects );
        }

        return newObjects;

    }, [ [ penSize, profile, heightLimit, widthLimit ] ]);


    const setPens = useCallback( ( hex, increment, lineStart ) => {
        setHexData( old => {

            const hexKey = makeKey( hex );

            let newObjects = { 
                [ hexKey ]: { 
                    ...( old[ hexKey ] ?? {}), 
                    pen:            1, 
                    newHeight:      increment != null && !lineStart
                        ? changeHexHeight( old[ hexKey ], Math.min( penSize + 1, heightLimit ), increment ) 
                        : null
                    // linePos:        lineStart ? 0 : null
                }
            };

            // if we're in line mode, we don't set any new heights until we finish, just draw the line
            if ( lineStart )
            {
                // Get all the intersecting hexes between start and end points
                const distance = HexUtils.distance( lineStart, hex );
                const lineKeys = [];
                const step = 1.0 / Math.max( distance, 1 );
                for ( let i = 0; i <= distance; i++ ) 
                    lineKeys.push( makeKey( HexUtils.round( HexUtils.hexLerp( lineStart, hex, step * i ) ) ) );
                newObjects = lineKeys.reduce( ( acc, cur, i ) => ({ 
                    ...acc, 
                    [ cur ]: { 
                        ...( old[ cur  ] ?? {}),
                        linePos:    i
                    } }), newObjects );
            }
            else 
            {
                // do it
                newObjects = applyPen( hex, old, newObjects, increment );
            }

            const newHexData = { ...old, ...newObjects };
            return newHexData;
        });

    }, [ hexData, penSize, profile, heightLimit, widthLimit ]);

    const commitNewHeights = useCallback( () => {

        const ringHeights = profileHeights[ profile ][ penSize ];

        setHexData( old => {

            const lineKeys = Object.keys( old ).filter( key => old[ key ]?.linePos != null );

            // If we've drawn a line, we have to check all hexes in the area to find if they're close enough to the line to be drawn.
            // If we're just doing regular drawing, just look at the hexes with data since if they don't have data, they weren't drawn on.
            const pkeys = lineKeys.length
                ? GridGenerator[ area ]( size, size ).map( hex => makeKey( hex ) )
                : Object.keys( old );
            
            const newObjects = pkeys.reduce( ( acc, cur ) => {

                let lineHeight;
                if ( lineKeys.length )
                {
                    if ( lineKeys.includes( cur ) )
                        lineHeight = penSize + 1;
                    else 
                    {
                        // we want to look for the closest hex in the line; if it's within range of the pen,
                        // set the height appropriately
                        const curHex = unMakeKey( cur );
                        const closestLineKey = lineKeys.reduce( ( closest, key ) => {

                            // find distance to this line key
                            const d = HexUtils.distance( unMakeKey( key ), curHex );
                            return ( d < closest.d ) ? { d, key } : closest;

                        }, { d: 100000 });

                        // is this point close enough to the line? Check the distance against the length of
                        // ringHeights, which tells us how many hexes outside the base hex get drawn.
                        if ( closestLineKey.d <= Math.min( ringHeights.length, widthLimit ) )
                            lineHeight = ringHeights[ closestLineKey.d - 1 ];
                    }

                    // lineHeight was set as the change to height; now calculate the actual new height, if we set a change
                    if ( lineHeight )
                        lineHeight = Math.max( 0, ( old[ cur ]?.height ?? 0 ) + Math.min( heightLimit, lineHeight ) * increment );

                }
                
                return { 
                    ...acc, 
                    [ cur ]: { 
                        ...( old[ cur  ] ?? {}), 
                        height:     lineHeight ?? acc[ cur ]?.newHeight ?? old[ cur ]?.newHeight ?? old[ cur ]?.height ?? 0,
                        newHeight:  null,
                        linePos:    null
                    } };
            }, {});

            // const newHexData = newObjects;
            queueRender( newObjects );
            return newObjects;
        });
    }, [ hexData, penSize, heightLimit, widthLimit, increment ]);

    const fill = useCallback( ( ) => {
        setHexData( old => {

            const newObjects = hexagons.map( hex => hex.data.key ).reduce( ( acc, cur ) => ({ 
                ...acc, 
                [ cur ]: { 
                    ...( acc[ cur  ] ?? {}), 
                    height:     ( acc[ cur ]?.height ?? 0 ) + 1
                } }), old );
            queueRender( newObjects );
            return newObjects;
        });

    }, [ hexagons ]);

    const timerIdRef = useRef( null );

    const queueRender = useCallback( ( newHexData, skipUndo ) => {

        if ( timerIdRef.current )
            clearTimeout( timerIdRef.current );

        const newTimeoutID = setTimeout( () => {
            postRender( hexagonsRef.current, newHexData );

            // when we render after undo-ing, we don't want to record that in the stack
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
        
    }, [ hexagons, hexList ]);

    const clearData = useCallback( ( ) => {
        console.log( 'clear' );
        setHexData({});
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
    }, [ undoStack ]);

    useEffect( () => {
        const keyDownHandler = event => {
            if ( event.key === 'z' && event.ctrlKey ) {
                event.preventDefault();
                undo();
            }
        };

        document.addEventListener( 'keydown', keyDownHandler );

        return () => {
            document.removeEventListener( 'keydown', keyDownHandler );
        };
    }, [ undo ]);

    console.log( `filename`, filename );

    return (
        <div className="App" >
            <div className='flexRow' style={{ padding: 4 }}>
                <SaveButton 
                    filename={filename} 
                    setFilename={setFilename} 
                    getContent={() => {
                        return JSON.stringify({
                            hexData,
                            penSize,
                            area,
                            hexSize,
                            size,
                            profile,
                            heightLimit,
                            widthLimit,
                            showText
                        }, undefined, 4 );
                    }}
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

                    setHexagons( GridGenerator[ data.area ]( data.size, data.size ).map( hex => ({ ...hex, data: { key: `${hex.q}:${hex.r}:${hex.s}` } }) ) );

                    queueRender( data.hexData );
                }} />
                <Button label="brush" onClick={() => queueRender( hexData )}/>
                <Button label="Clear" onClick={clearData}/>
                <Button label="exposure_plus_1" onClick={fill}/>
                <Button label="undo" onClick={() => {
                    undo();
                }} disabled={undoStack.length <= 1}/>
                <NumberField label={"Size"} value={size} setValue={newValue => {
                    setSize( newValue );
                    setHexagons( GridGenerator[ area ]( newValue, newValue ).map( hex => ({ ...hex, data: { key: `${hex.q}:${hex.r}:${hex.s}` } }) ) );
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
                    setHexagons( GridGenerator[ newArea ]( size, size ).map( hex => ({ ...hex, data: { key: `${hex.q}:${hex.r}:${hex.s}` } }) ) );
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
                // viewBox={`${0} ${-window.innerHeight / 4} ${window.innerWidth} ${window.innerHeight}`} 
                className='hexgrid'
            >
                <Layout size={{ x: hexSize, y: hexSize }} flat={false} space={0} spacing={1.01}>
                    {
                        hexList.map( ( hex, i ) => <Hexagon 
                            cellClassName={`${hexData[ hex.data.key ]?.newHeight ? 'newHeight' : ''}`}
                            key={i} 
                            q={hex.q} 
                            r={hex.r} 
                            s={hex.s}
                            // fill={'3e0047'}
                            // className={` h${hexData[ hex.data.key ]?.height ?? 0} `}
                            cellStyle={{ 
                                fillOpacity:    1 - ( hexData[ hex.data.key ]?.newHeight ?? 
                                    hexData[ hex.data.key ]?.height ?? 0 ) * 0.05,
                                fill:           hexData[ hex.data.key ]?.pen 
                                    ? `rgb(${0 + ( 1 - hexData[ hex.data.key ]?.pen ) * 100},` +
                                        `${90 + ( 1 - hexData[ hex.data.key ]?.pen ) * 100},` +
                                        `${0 + ( 1 - hexData[ hex.data.key ]?.pen ) * 100})`
                                    : hexData[ hex.data.key ]?.linePos != null
                                        ? 'rgb(180, 104, 5)'
                                        : null
                            }}
                            // cellStyle={{ fillOpacity: 0.5 }}
                            onMouseDown={ e => {
                                setDraggedHexes([ currentHex.data.key ]);
                                
                                // the pen is already set but this sets the new heights for the initial cell
                                const increment = e.shiftKey ? -1 : e.ctrlKey ? 0 : 1;
                                const lineStart = e.altKey ? currentHex.state.hex : null;
                                setPens( currentHex.state.hex, increment, lineStart );

                                setIncrement( increment );
                                setLineStart( lineStart );
                            }} 
                            onMouseUp={() => {
                                if ( draggedHexes )
                                {
                                    // if ( lineStart )
                                    //     setLineHeights();
                                    commitNewHeights();
                                    setDraggedHexes( null );
                                    setIncrement( null );
                                    setLineStart( null );
                                    // setTimeout( () => {
                                    //     render();
                                    // }, 100 );
                                    
                                }
                            }} 
                            onMouseEnter={( e, h ) => {
                                // console.log( 'enter', h.state.hex );
    
                                setCurrentHex({ ...h });

                                if ( draggedHexes )
                                    draggedHexes.push( h.data.key );
                                
                                setPens( h.state.hex, increment, lineStart );
                            }} 
                            onMouseLeave={() => {
                                clearPens();
                            }} 
                            data={{ ...hex.data }}

                        >
                            {showText && <>
                                <Text 
                                // y={-1} 
                                    className='mainText' 
                                    style={{ 
                                        fill:       ( hexData[ hex.data.key ]?.height ?? 0 ) > 10 ? '#2d2dcf' : 'lightcyan',
                                        fontSize:   hexSize * 0.4
                                    }}
                                >
                                    {`${hexData[ hex.data.key ]?.height ?? 0}-${hexData[ hex.data.key ]?.newHeight ?? ''}`}
                                </Text>
                                <Text 
                                    y={hexSize / 2} 
                                    className='subtext'
                                    style={{ 
                                        fill:       ( hexData[ hex.data.key ]?.height ?? 0 ) > 10 ? '#2d2dcf' : 'lightcyan',
                                        fontSize:   hexSize * 0.4
                                    }}
                                >{`${hex.data.key}`}</Text>
                            </>}
                        </Hexagon> )
                    }
                </Layout>
            </HexGrid>
        </div>
    );
}

export default App;
