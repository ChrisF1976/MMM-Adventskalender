# MMM-Adventskalender
The MMM-Adventskalender module for MagicMirror is an interactive Advent calendar that displays a grid of doors (24 in total) which open on specific days in December. The module includes various configurable options and functionalities designed to enhance the user experience. 

![Adventskalender](./example_1.png)

[Module description]

## Installation

### Install

In your terminal, go to your [MagicMirror²][mm] Module folder and clone MMM-Adventskalender:

```bash
cd ~/MagicMirror/modules
git clone [GitHub url]
```

### Update

```bash
cd ~/MagicMirror/modules/MMM-Adventskalender
git pull
```

## Using the module

To use this module, add it to the modules array in the `config/config.js` file:

```js
{
    module: "MMM-Adventskalender",
    position: "top_center",
    config: {
        backgroundImage: "/modules/MMM-Adventskalender/images/background.jpg",
        doorMargin: 30,
        moduleWidth: 800,
        moduleHeight: 600,
        autopen: true,
        autoopenat: "10:00",
    },
},

```


## Configuration options

Option|Possible values|Default|Description
------|------|------|-----------
`backgroundImage`|`string`|not available|link to your background image to use
`doorMargin`|`integer`|margin around each door.
`moduleWidth`|`string`|not available|total height
`moduleHeight`|`string`|not available|total width
`autopen`|`boolean`|false|opens the door of the day automatic. Useful in headless mode.
`autopenat`|`string`|"00:00"|defines the time when the door should open.


## Pictures
- choose a background picture
- choose 24 other pictures for the door and name it 01....24
- I took the pictures as a proof of concept from [Pixabay]:'https://pixabay.com'

[mm]: https://github.com/MagicMirrorOrg/MagicMirror
