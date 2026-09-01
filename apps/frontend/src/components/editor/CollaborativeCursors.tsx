import React from 'react';
import { useViewport } from 'reactflow';

interface Cursor {
  socketId: string;
  username: string;
  x: number;
  y: number;
}

interface CollaborativeCursorsProps {
  cursors: Cursor[];
}

function getUsernameColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 85%, 60%)`;
}

export const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = ({ cursors }) => {
  const { x: vpX, y: vpY, zoom: vpZoom } = useViewport();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {cursors.map((cursor) => {
        const left = cursor.x * vpZoom + vpX;
        const top = cursor.y * vpZoom + vpY;
        const color = getUsernameColor(cursor.username);

        return (
          <div
            key={cursor.socketId}
            style={{
              position: 'absolute',
              left: `${left}px`,
              top: `${top}px`,
              transform: 'translate(-2px, -2px)',
              transition: 'left 0.1s ease-out, top 0.1s ease-out',
            }}
            className="flex flex-col items-start gap-1"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={color}
              stroke="rgba(0,0,0,0.8)"
              strokeWidth="2"
              className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
            >
              <path d="M4.5 3v15.2l3.8-3.8 2.8 5.6 2.2-1.1-2.8-5.6 5.3-.1z" />
            </svg>
            <div
              style={{ backgroundColor: color }}
              className="text-white text-xs font-bold px-2 py-0.5 rounded-full select-none whitespace-nowrap -ml-1"
            >
              {cursor.username}
            </div>
          </div>
        );
      })}
    </div>
  );
};
