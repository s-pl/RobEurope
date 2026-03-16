/**
 * @fileoverview Toast state store + hook.
 *
 * Implements a small in-memory toast store with subscribe/update/dismiss helpers.
 * Auto-dismisses toasts after 5 seconds by default.
 */

import * as React from "react"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 300
const TOAST_AUTO_DISMISS_DELAY = 5000

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastTimeouts = new Map()
const autoDismissTimeouts = new Map()

const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

/**
 * Reducer for toast actions.
 * @param {any} state
 * @param {any} action
 * @returns {any}
 */
export const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
        if (autoDismissTimeouts.has(toastId)) {
          clearTimeout(autoDismissTimeouts.get(toastId))
          autoDismissTimeouts.delete(toastId)
        }
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
          if (autoDismissTimeouts.has(toast.id)) {
            clearTimeout(autoDismissTimeouts.get(toast.id))
            autoDismissTimeouts.delete(toast.id)
          }
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners = []

let memoryState = { toasts: [] }

function dispatch(action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

/**
 * Create a toast notification.
 *
 * @param {Object} props
 * @param {string} [props.title] - Toast title
 * @param {string} [props.description] - Toast description
 * @param {string} [props.variant] - 'default' | 'success' | 'destructive'
 * @param {number} [props.duration] - Auto-dismiss duration in ms (default 5000)
 * @returns {{ id: string, dismiss: Function, update: Function }}
 */
function toast({ duration = TOAST_AUTO_DISMISS_DELAY, ...props }) {
  const id = genId()

  const update = (props) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  // Auto-dismiss after duration
  if (duration > 0) {
    const autoDismissTimeout = setTimeout(() => {
      autoDismissTimeouts.delete(id)
      dismiss()
    }, duration)
    autoDismissTimeouts.set(id, autoDismissTimeout)
  }

  return {
    id: id,
    dismiss,
    update,
  }
}

/**
 * React hook exposing toast state and actions.
 *
 * @returns {{ toasts: any[], toast: Function, dismiss: Function }}
 */
function useToast() {
  const [state, setState] = React.useState(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
