ComboBox & Lit
==============
[TOC]

v0.3.0 - 23-03-2023

Combobox lit customElement. Combobox is a composite widget that combines a named input field with a popup providing possible values for that input field.

PS: This version is without an input field. The input field can be bound in the parent element listening for the *change* event fired from the combobox when option is selected.

```html
<!-- lit component -->
<label for="prefix">
<input id="prefix" type="text" name="prefix" value="${this.value}" />
<combo-box @change=${handleChange}>
```

## A11y
https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/

## 🐝 API

### 📒 Properties/Attributes

| Name | Type | Default | Description
| ------------- | ------------- | ---------- | ----------------------------------------
| label     | String | `''` | Meta LONG_LIVE_TOKEN
| options   | Array  | `[{...}, {...} ...]` | Default options {id: '', name:'', img:''}

### Methods

No Methods

### Events

|  Name Name  |  Target  |   Detail   |   Description
| ----------- | -------- | ---------- | -----------------------------------------
|  `change`  |  `combo-box` | `{ detail: { index: options<Number> }` | Fired when selected change

### 🧁 CSS Custom Properties

| Name | Default | Description
| ---------------------------- | -------- | ----------------------------------------------
| `--combo-label-font-size`    | `2.3rem` | Label font-size
| `--combo-height`             | `7.1rem` | Combobox (list close) height
| `--combo-col`           | `fit-content(100%) auto;` | Grid columns layout combobox
| `--combo-font-size`          | `3rem`   | Combobox (list close) font-size
| `--combo-border`             | `none`   | Combobox / List of options border
| `--combo-bk-color`           | `white`  | Combobox / List background-color
| `--combo-list-max-height`    | `35rem`  | Max List of options height
| `--combo-list-padding`       | `.5rem`  | List / Options Padding
| `--combo-option-col`     | `1fr 3fr;`   | Grid columns layout Option
| `--combo-option-height`      | `3.1rem` | Set the img height > width as consequence (ratio respected)
| `--combo-option-font-size`   | `1.5rem` | Option font-size


## Contributing

Got **something interesting** you'd like to **share**? Learn about [contributing](https://github.com/CICCIOSGAMINO/init/blob/master/CONTRIBUTING.md).

# Accessibility

# 🔧 TODO ✅ ❌
- [❌] Basic Unit testing
- [✅] A11y compatible

# License
[GNU General Public License v3.0](https://github.com/CICCIOSGAMINO/init/blob/master/LICENSE)

Made 🧑‍💻 by [@cicciosgamino](https://cicciosgamino.web.app)