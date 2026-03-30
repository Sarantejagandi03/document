import { getCursorCoordinates } from "../utils/cursor";

export default function CursorLayer({ users, text, selfUserId }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
      {users.filter((entry) => entry.userId !== selfUserId && entry.cursor).map((entry) => {
        const { top, left } = getCursorCoordinates(text, entry.cursor.position);
        return (
          <div key={entry.socketId} className="absolute transition-all" style={{ top: `${top + 24}px`, left: `${left + 24}px` }}>
            <div className="h-6 w-[2px]" style={{ backgroundColor: entry.color }} />
            <span className="mt-1 inline-block rounded-full px-2 py-1 text-[10px] font-semibold text-white" style={{ backgroundColor: entry.color }}>
              {entry.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
