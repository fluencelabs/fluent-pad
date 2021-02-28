import React, { useRef } from 'react';
import './App.scss';
import { useRealtimeDrawer, useRealtimeViewer } from 'react-realtime-drawing';

interface Props {
    height: number;
    onChnge?: (e: any) => void;
}

export const DrawingBoard: React.FC<Props> = ({ onChnge, height }) => {
    const [viewerRef, onChange] = useRealtimeViewer();
    const [pointsArray, setPointsArray] = React.useState(null);

    const [drawerRef] = useRealtimeDrawer({
        color: 'black',
        onChange,
    });

    return (
        <div
            style={{
                width: '100%',
                height: height,
            }}
            className="drawing-board"
        >
            <canvas ref={drawerRef} style={{ backgroundColor: 'white' }} onChange={onChnge} />
        </div>
    );
};
