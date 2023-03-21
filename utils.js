/**
 * Save a list of named combobox actions, for future readability
 */
export const SelectActions = Object.freeze({
    Close: 0,
    CloseSelect: 1,
    First: 2,
    Last: 3,
    Next: 4,
    Open: 5,
    PageDown: 6,
    PageUp: 7,
    Previous: 8,
    Select: 9,
    Type: 10
})

/**
 * Map a key press to an action
 * @param {Event} event
 * @param {*} menuOpen 
 */
export const getActionFromKey = (event, menuOpen ) => {

    const { key, altKey, ctrlKey, metaKey } = event
    // all keys that will do the default open action
    const openKeys = [
        'ArrowDown',
        'ArrowUp',
        'Enter',
        ' '
    ]

    // handle opening when close
    if (!menuOpen && openKeys.includes(key)) {
        return SelectActions.Open
    }

    // home and end move the selected option when open or closed
    if (key === 'Home') {
        return SelectActions.First
    }
    if (key === 'End') {
        return SelectActions.Last
    }

    // handle typing characters when open or closed
    if (
        key === 'Backspace' ||
        key === 'Clear' ||
        (key.length === 1 && key !== ' ' && !altKey && !ctrlKey && !metaKey)
    ) {
        return SelectActions.Type
    }

    // handle keys when open
    if (menuOpen) {
        if (key === 'ArrowUp' && altKey) {
            return SelectActions.CloseSelect
        } else if (key === 'ArrowDown' && !altKey) {
            return SelectActions.Next
        } else if (key === 'ArrowUp') {
            return SelectActions.Previous
        } else if (key === 'PageUp') {
            return SelectActions.PageUp
        } else if (key === 'PageDown') {
            return SelectActions.PageDown
        } else if (key === 'Escape') {
            return SelectActions.Close
        } else if (key === 'Enter' || key === ' ') {
            return SelectActions.CloseSelect
        }
    }
}

/**
 * check if element is visible in browser view port
 * @param {*} el 
 * @returns 
 */
export const isElementInView = (el) => {
    const bounding = el.getBoundingClientRect()

    return (
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        bounding.bottom <=
            (window.innerHeight || document.documentElement.clientHeight) &&
        bounding.right <=
            (window.innerWidth || document.documentElement.clientWidth)
    )
}

/**
 * get an updated option index after performing an action
 * @param {*} currentIndex 
 * @param {*} maxIndex 
 * @param {*} action 
 * @returns 
 */
export const getUpdatedIndex = (currentIndex, maxIndex, action) => {
    const pageSize = 10 // used for pageup/pagedown
  
    switch (action) {
      case SelectActions.First:
        return 0
      case SelectActions.Last:
        return maxIndex
      case SelectActions.Previous:
        return Math.max(0, currentIndex - 1)
      case SelectActions.Next:
        return Math.min(maxIndex, currentIndex + 1)
      case SelectActions.PageUp:
        return Math.max(0, currentIndex - pageSize)
      case SelectActions.PageDown:
        return Math.min(maxIndex, currentIndex + pageSize)
      default:
        return currentIndex
    }
  }

/**
 * check if an element is currently scrollable
 * @param {*} element 
 * @returns 
 */
export const isScrollable = (element) => {
  return element && element.clientHeight < element.scrollHeight
}

/**
 * ensure a given child element is within the parent's visible scroll area 
 * if the child is not visible, scroll the parent
 * @param {*} activeElement 
 * @param {*} scrollParent 
 */
export const maintainScrollVisibility = (activeElement, scrollParent) => {
    const { offsetHeight, offsetTop } = activeElement
    const { offsetHeight: parentOffsetHeight, scrollTop } = scrollParent
  
    const isAbove = offsetTop < scrollTop
    const isBelow = offsetTop + offsetHeight > scrollTop + parentOffsetHeight
  
    if (isAbove) {
      scrollParent.scrollTo(0, offsetTop)
    } else if (isBelow) {
      scrollParent.scrollTo(0, offsetTop - parentOffsetHeight + offsetHeight)
    }
  }