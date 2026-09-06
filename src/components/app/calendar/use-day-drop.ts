'use client'

import { useDroppable } from '@dnd-kit/core'

// One hook shared by month/week/day cells so drop-zone wiring isn't repeated
// three times — each cell is droppable under its own YYYY-MM-DD id.
export function useDayDrop(dateStr: string) {
  const { isOver, setNodeRef } = useDroppable({ id: dateStr })
  return { isOver, dropRef: setNodeRef }
}
