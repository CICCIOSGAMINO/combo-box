import { html, css, svg, LitElement } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import { classMap } from 'lit/directives/class-map.js'

import {
    SelectActions,
    isElementInView,
    isScrollable,
    maintainScrollVisibility,
    getActionFromKey,
    getUpdatedIndex
} from './utils.js'

import {
    VNM,
    JOR,
    ISL,
    CAN,
    MTQ,
    SWZ
} from './flags.js'

export class ComboBox extends LitElement {

    combo
    combobox

    static get styles () {
        return css`

            :host {
                /* CSS Custom vars
                --combo-label-font-size: 2.3rem;
                --combo-height: 7.1rem;
                --combo-col: fit-content(100%) auto;    grid columns layout combobox
                --combo-font-size: 3rem;
                --combo-border: none;
                --combo-bk-color: white;
                --combo-list-max-height: 35rem;     max list with options height
                --combo-list-padding: .5rem;        padding list and options
                --combo-option-col: 1fr 3fr;        grid columns layout option
                --combo-option-height: 3.1rem;      set the flag height > width as consequence
                --combo-option-font-size: 1.5rem;
                 */

                /* main feature to set the combo width
                    --combo-col: fit-content(100%) 233px;
                    --combo-col: 199px 273px;
                    */

                display: block;
            }

            .combo-label {
                margin-bottom: .5rem;
                display: block;

                font-size: var(--combo-label-font-size, 2.3rem);
            }

            .combo {
                display: block;
                position: relative;              
            }

            #combobox {
                display: inline-block;
                line-height: 0;

                border: var(--combo-border, 2px solid #333);
                border-radius: 3px;

                background-color: var(--combo-bk-color, #fff);
            }

            #combobox:focus {
                border-color: #0067b8;
                box-shadow: 0 0 4px 2px #0067b8;
                outline: 4px solid transparent;
            }

            /* combobox content eg. selected option */
            .combobox-content {
                display: grid;
                grid-template-columns: var(--combo-col, fit-content(100%) auto);
                justify-items: center;
                align-items: center;
            }

            .combobox-content svg {
                justify-self: start;
                width: auto;
                height: var(--combo-height, 7rem);
            }

            .combobox-content span {
                font-size: var(--combo-font-size, 3rem);
            }

            /* combobox list */
            .combobox-list {
                box-sizing: border-box;
                padding: var(--combo-list-padding, 1rem);
                width: 100%;  /* with same of the combobox */
                max-height: var(--combo-list-max-height, 35rem);
                display: none;

                position: absolute;
                top: 100%;
                left: 0;

                overflow-y: auto;

                border: var(--combo-border, 2px solid #333);
                border-radius: 3px;

                background-color: var(--combo-bk-color, #fff);
            }

            .open .combobox-list {
                display: inline-block;
            }

            /* options in the list */
            .option {
                padding: var(--combo-list-padding, 1rem);
                display: grid;
                /* the size of image in the grid layout fix the width / height
                   of all option > combobox-list width / heigth */
                grid-template-columns: var(--combo-option-col, fit-content(100%) auto);
                gap: 1.7rem;
            }

            .option:hover {
                background-color: pink;
            }

            .current.option {
                background-color: yellowgreen;
            }

            .option span {
                font-size: var(--combo-option-font-size, 1.9rem);
            }

            .option svg {
                width: auto;
                height: var(--combo-option-height, 3.1rem);
            }

        `
    }

    static get properties () {
        return {
            label: String,
            options: {
                type: Array,
                state: true,
                attribute: false
            },
            open: Boolean,
            searchString: {
                type: String,
                state: true,
                attribute: false
            },
            selected: Number
        }
    }

    constructor () {
        super()
        this.open = false
        this.label = ''
        this.selected = 0
        this.searchString = ''
        this.searchTimeout = null

        // @DEFAULT options
        this.options = [
            { id: 0, name: 'Viet Nam', img: VNM },
            { id: 1, name: 'Jordan', img: JOR },
            { id: 2, name: 'Island', img: ISL },
            { id: 3, name: 'Canada', img: CAN },
            { id: 4, name: 'Martinique', img: MTQ },
            { id: 5, name: 'Eswatini', img: SWZ }
        ]
    }

    firstUpdated () {
        if (!this.renderRoot) return

        this.combo =
            this.renderRoot.getElementById('combo')

        this.combobox =
            this.renderRoot.getElementById('combobox')

        this.selectOption(this.selected)
    }
    
    updateMenuState (open, callFocus = true) {
        if (this.open === open) return

        this.open = open
        // update aria-expanded
        this.combobox.setAttribute('aria-expanded', `${open}`)
        // open / close
        open ?
            this.combo.classList.add('open') :
            this.combo.classList.remove('open')

        // update aria-activedescendant
        const activeID = open ? `opt-${this.selected}` : ''
        this.combobox.setAttribute('aria-activedescendant', activeID)

        if (activeID === '' && isElementInView(this.combobox)) {
            this.combobox.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            })
        }

        // move focus back to the combobox if needed
        if (callFocus) {
            this.combobox.focus()
        }
        

    }

    handleComboboxClick (e) {
        this.updateMenuState(!this.open, false)
    }

    handleComboboxBlur (e) {

        // do not do blur action if ignoreBlur flag has been set
        if (this.ignoreBlur) {
            this.ignoreBlur = false
            return
        }

        // select current option and close
        if (this.open) {
            this.selectOption(this.selected)
            this.updateMenuState(false, false)
        }
    }

    handleComboboxKeydown (e) {
        const { key } = e
        const max = this.options.length -1

        // @DEBUG
        // console.log('@KEYDOWN >> ', key)

        const action = getActionFromKey(e, this.open)
        switch (action) {
            case SelectActions.Last:
            case SelectActions.First:
                this.updateMenuState(true)
            // intentional fallthrough
            case SelectActions.Next:
            case SelectActions.Previous:
            case SelectActions.PageUp:
            case SelectActions.PageDown:
                e.preventDefault()
                return this.handleOptionChange(
                    getUpdatedIndex(this.selected, max, action))
            case SelectActions.CloseSelect:
                e.preventDefault()
                this.selectOption(this.selected)
            // intentional fallthrough
            case SelectActions.Close:
                e.preventDefault()
                return this.updateMenuState(false)
            case SelectActions.Type:
                return this.handleComboType(key)
            case SelectActions.Open:
                e.preventDefault()
                return this.updateMenuState(true)
        }
    }

    /**
     * When combo is focused type letter for get the nearest option
     * @param {String} letter 
     */
    handleComboType (letter) {
        // open listbox if close
        this.updateMenuState(true)

        // find the index of the first matching option
        const searchString = this.getSearchString(letter)
        const searchIndex = this.getIndexByLetter(
            this.options,
            searchString,
            this.selected + 1
        )

        if (searchIndex >= 0) {
            // if a match ws found, go to it
            this.handleOptionChange(searchIndex)
        } else {
            // if not matches, clear the timeout and search string
            clearTimeout(this.searchTimeout)
            this.searchString = ''
        }
    }

    getSearchString (char) {
        // reset typing timeout and start new timeout
        // this allows us to make multiple-letter matches, like a native select
        if (typeof this.searchTimeout === 'number') {
            clearTimeout(this.searchTimeout)
        }

        this.searchTimeout = setTimeout(() => 
            this.searchString = '', 500)

        // and most recent letter to saved search string
        this.searchString += char
        return this.searchString
    }

    /**
     * return the index of an option from an array of options, based on a search string
     * if the filter is multiple iterations of the same letter (e.g "aaa"), then cycle
     * through first-letter matches
     * 
     * @param {Array<Object>} options - Array of Object
     * @param {*} filter
     * @param {*} startIndex 
     */
    getIndexByLetter (options, filter, startIndex = 0) {
        const firstMatch = this.filterOptions(options, 'name', filter)[0]

        // @DEBUG
        // console.log('@FIRST-MATCH >> ', firstMatch)

        const allSameLetter = (array) =>
            array.every((letter) => letter === array[0])

        // first check if there is an exact match for the typed string
        if (firstMatch) {
            return options.indexOf(firstMatch)

        // if the same letter is being repeated, cycle through first-letter matches
        } else if (allSameLetter(filter.split(''))) {
            const matches = this.filterOptions(options, filter[0])
            return options.indexOf(matches[0])

        // no match return -1
        } else {
            return -1
        }
    }

    /**
     * 
     * @param {Array<Object>} options - Array of Object
     * @param {String} key - the key of Object to use in search 
     * @param {*} filter 
     * @param {*} exclude 
     * @returns 
     */
    filterOptions (options = [], key = 'name', filter, exclude = []) {
        return options.filter((option) => {
            const matches =
                option[key].toLowerCase().indexOf(filter.toLowerCase()) === 0
            return matches && exclude.indexOf(option) < 0
        })
    }

    selectOption (index) {

        // update state
        this.selected = index

        // fire the customEvent
        const selectedEvent =
            new CustomEvent('change', {
                bubbles: true,
                composed: true,
                detail: {
                    index
                }
            })

        this.dispatchEvent(selectedEvent)
    }

    handleOptionClick (e) {
        e.stopPropagation()
        const index = e.currentTarget.dataset.index
        this.handleOptionChange(index)
        this.selectOption(index)
        this.updateMenuState(false)
    }

    handleOptionMousedown (e) {
        // Clicking an option will cause a blur event,
        // but we don't want to perform the default keyboard blur action
        this.ignoreBlur = true
    }

    handleOptionChange (index) {
        // update state
        this.selected = index

        // update aria-activedescendant
        this.combobox.setAttribute('aria-activedescendant', `opt-${index}`)

        // ensure the new option is in the view
        const optionsEl =
            this.renderRoot.querySelectorAll('[role=option]')
        const listbox =
            this.renderRoot.getElementById('listbox')

        if (isScrollable(listbox)) {
            maintainScrollVisibility(optionsEl[index], listbox)
        }

        // ensure the new option is visible on screen
        if (!isElementInView(optionsEl[index])) {
            optionsEl[index].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            })
        }
    }

    // render the item for the combobox
    comboboxTemplate () {
        const option = this.options[this.selected]

        return option ?
            html`
                <div class="combobox-content">
                    ${option.img}
                    
                    <span>${option.name}</span>
                </div>
            ` : null

    }

    /**
     * Render the <div>option</div> item based on option data
     * @param {Object} option - Option data used to render option
     * @param {*} index 
     * @returns 
     */
    optionTemplate (option, index) {

        const classes = {
            option: true,
            current: (this.selected === index)
        }

        return html`
            <div
                id="opt-${index}"
                class=${classMap(classes)}
                role="option"
                data-index=${index}
                aria-selected=${this.selected === index}
                @click=${this.handleOptionClick}
                @mousedown=${this.handleOptionMousedown}>
                
                ${option.img}

                <span>${option.id} - ${option.name}</span>
                
            </div>
        `
    }

    render () {
        return html`
            <!-- TODO REMOVE (or FIX) -->
            <span>${this.searchString}</span>

            <label id="combo-label" class="combo-label">${this.label}</label>
            <div
                id="combo"
                class="combo">

                <div
                    id="combobox"
                    role="combobox"
                    tabindex="0"
                    @click=${this.handleComboboxClick}
                    @keydown=${this.handleComboboxKeydown}
                    @blur=${this.handleComboboxBlur}
                    aria-controls="listbox"
                    aria-expanded="false"
                    aria-haspopup="listbox"
                    aria-labelledby="combo-label">

                    ${this.comboboxTemplate()}
                </div>

                <div
                    id="listbox"
                    class="combobox-list"
                    role="listbox"
                    tabindex="-1"
                    aria-labelledby="combo-label">

                    ${repeat(
                        this.options,   // the data
                        (option) => option.id,   // the id
                        (option, index) => this.optionTemplate(option, index)
                    )}

                </div>
            </div>
        `
    }
}

customElements.define('combo-box', ComboBox)