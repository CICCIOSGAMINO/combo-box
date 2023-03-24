import { html, css, svg, LitElement } from 'lit'
import './combo-box.js'

import {
    VAT,
    PAK,
    UNK,
    VEN,
    ATA,
    ITA
} from './flags.js'

export class LiteApp extends LitElement {

    static get styles () {
        return css`
            :host {
                display: block;
            }

            combo-box {
                --combo-col: 131px 243px;
                --combo-list-max-height: 27rem;
            }
        `
    }

    static get properties () {
        return {
            detail: {
                type: String,
                state: true,
                attribute: false
            },
            disabled: Boolean
        }
    }

    constructor () {
        super()

        this.disabled = false

        this.options = [
            { id: '1', name: 'Vatican State', img: VAT },
            { id: '2', name: 'Pakistan', img: PAK },
            { id: '3', name: 'Kosovo', img: UNK },
            { id: '4', name: 'Venezuela', img: VEN },
            { id: '5', name: 'Antartica', img: ATA },
            { id: '6', name: 'Italy', img: ITA },
            { id: '7', name: 'Vatican State', img: VAT },
            { id: '8', name: 'Pakistan', img: PAK },
            { id: '9', name: 'Kosovo', img: UNK },
            { id: '10', name: 'Venezuela', img: VEN },
            { id: '11', name: 'Antartica', img: ATA },
            { id: '12', name: 'Italy', img: ITA }
        ]

    }

    handleSelected (e) {
        this.detail = JSON.stringify(e.detail)
    }

    handleClick (e) {
        this.disabled = !this.disabled
    }

    render () {
        return html`
            <button
                @click=${this.handleClick}>
                Disable / Enable
            </button>

            <combo-box
                label="Nationality"
                .disabled=${this.disabled}
                .options=${this.options}
                @change=${this.handleSelected}>
            </combo-box>

            <hr>

            <span>${this.detail}</span>
        `
    }
}

customElements.define('lite-app', LiteApp)