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

export const ABW = svg`
<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 27 18">
<path fill="#418fde" d="M0,0h27v18H0V0z"/>
<path fill="#ffd100" d="M0,12h27v1H0v1h27v1H0V12z"/>
<polygon fill="#EF3340" stroke="#FFF" stroke-width="0.2" stroke-miterlimit="10" points="4.625,3.375 4,1.349609 3.375,3.375 1.349609,4 3.375,4.625 4,6.650391 4.625,4.625 6.650391,4"/>
</svg>`

export class ComboBox extends LitElement {

    combo
    combobox

    static get styles () {
        return css`

            :host {
                --combo-height: 7.1rem;;
                --option-height: 3.1rem;

                display: block;
            }

            .combo {
                display: block;
                position: relative;                
                background-color: red;
            }

            #combobox {
                line-height: 0;
            }

            #combobox svg {
                width: auto;
                height: var(--combo-height);
            }

            /* combobox list */
            .combobox-list {
                max-height: 355px;
                display: none;

                position: absolute;
                top: 100%;
                left: 0;

                overflow-y: auto;

                background-color: gold;
            }

            .open .combobox-list {
                display: block;
            }

            /* options in the list */
            .option {
                display: grid;
                grid-template-columns: 1fr 5fr;
                gap: 1.7rem;
            }

            .option:hover {
                background-color: purple;
            }

            .current.option {
                background-color: yellowgreen;
            }

            .option span {
                
            }

            .option svg {
                width: auto;
                height: var(--option-height);
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
        this.selected = 0
        this.searchString = ''
        this.searchTimeout = null


        // @DEBUG
        this.options = [
            { id: 'x1', name: 'ONE', img: ABW },
            { id: 'x2', name: 'TWO', img: ABW },
            { id: 'x3', name: 'THREE', img: ABW },
            { id: 'x4', name: 'FOUR', img: ABW },
            { id: 'x5', name: 'FIVE', img: ABW }
        ]
    }

    firstUpdated () {
        if (!this.renderRoot) return

        this.combo =
            this.renderRoot.getElementById('combo')

        this.combobox =
            this.renderRoot.getElementById('combobox')
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
        console.log('@FIRST-MATCH >> ', firstMatch)

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
    comboboxTemplate (option = undefined) {
        
        return option ?
            html`
                ${option.img} ${option.name}
            ` :
            html`
                ${this.options[0].img} ${this.options[0].name}
            `
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
            <!-- TODO -->
            <span>${this.searchString}</span>

            <label id="combo-label" class="combo-label">${this.label}</label>
            <div id="combo" class="combo">

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

                    ${this.comboboxTemplate(this.options[this.selected])}
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