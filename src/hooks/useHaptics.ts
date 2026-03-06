import { useWebHaptics } from "web-haptics/react"

export function useHaptics() {
  const { trigger } = useWebHaptics()

  const haptics = {
    // Soft tap - for general button presses
    soft: () => trigger([{ duration: 40 }]),

    // Rigid tap - for confirmations, submit buttons
    rigid: () => trigger([{ duration: 10 }], { intensity: 1 }),

    // Selection - for selecting options, toggles
    selection: () => trigger([{ duration: 8 }], { intensity: 0.3 }),

    // Nudge - for attention, notifications, important actions
    nudge: () => trigger([
      { duration: 80, intensity: 0.8 },
      { delay: 80, duration: 50, intensity: 0.3 },
    ]),

    // Buzz - for errors, long operations complete
    buzz: () => trigger([{ duration: 1000 }], { intensity: 1 }),
  }

  return haptics
}
