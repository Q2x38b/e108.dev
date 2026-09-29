/* eslint-disable react-refresh/only-export-components -- the handle factory lives beside the component it pairs with */
import type { ReactNode } from 'react'
import { Tooltip } from '@base-ui/react/tooltip'

// One tooltip for a group of icon buttons. Each trigger passes its label to a
// shared handle as a payload and a single Root renders the active one, so
// moving across the group glides one popup from button to button and slides
// the label in from the direction of travel, instead of fading a tooltip out
// and another in. Styles live under "Group tooltip" in App.css.
export const createTooltipGroup = () => Tooltip.createHandle<ReactNode>()

export type TooltipGroupHandle = ReturnType<typeof createTooltipGroup>

export const TooltipGroupTrigger = Tooltip.Trigger

export function TooltipGroup({ handle, children }: { handle: TooltipGroupHandle; children: ReactNode }) {
  return (
    <Tooltip.Provider delay={50} closeDelay={50} timeout={50}>
      {children}
      <Tooltip.Root handle={handle}>
        {({ payload }) => (
          <Tooltip.Portal>
            <Tooltip.Positioner className="group-tooltip-positioner" side="top" sideOffset={6}>
              <Tooltip.Popup className="group-tooltip">
                <Tooltip.Viewport className="group-tooltip-viewport">{payload}</Tooltip.Viewport>
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
