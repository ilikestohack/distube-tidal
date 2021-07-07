# distube-tidal
 A DisTube custom plugin for supporting Tidal URL.
 Required DisTube version >= 3.0.0

# Feature
 This plugin grabs the songs on Tidal then searches on YouTube and play with DisTube.

# Installation
```sh
npm install distube-tidal
```

# Usage
```js
const Discord = require('discord.js')
const DisTube = require('distube')
const TidalPlugin = require("distube-tidal")
const client = new Discord.Client()
const distube = new DisTube(client, {
    searchSongs: 10,
    emitNewSongOnly: true,
    plugins: [new TidalPlugin({ parallel: true })]
})

// Now distube.play can play tidal url.

client.on('message', message => {
	if (message.author.bot) return
	if (!message.content.startsWith(config.prefix)) return
	const args = message.content.slice(config.prefix.length).trim().split(/ +/g)
	const command = args.shift()
	if (command === 'play') distube.play(message, args.join(' '))
})
```

## Documentation

### TidalPlugin([options])
- `options.parallel`: Default is `true`. Whether or not searching the playlist in parallel.
- `options.emitPlaySongAfterFetching`: Default is `false`. Emit `playSong` event before or after fetching all the songs.
  > If `false`, DisTube plays the first song -> emits `playSong` events -> fetches all the rest\
  > If `true`, DisTube plays the first song -> fetches all the rest -> emits `playSong` events


### Tested with the following links

- http://www.tidal.com/playlist/1c5d01ed-4f05-40c4-bd28-0f73099e9648
- https://www.tidal.com/album/80216363
- http://www.tidal.com/track/64975224
- https://tidal.com/browse/video/101846480
- http://www.tidal.com/artist/3575680
- http://tidal.com/playlist/1c5d01ed-4f05-40c4-bd28-0f73099e9648
- http://tidal.com/album/80216363
- http://tidal.com/track/64975224
- https://tidal.com/video/101846480
- http://www.tidal.com/browse/artist/3575680
- tidal.com/artist/3575680
- tidal.com/playlist/1c5d01ed-4f05-40c4-bd28-0f73099e9648
- tidal.com/browse/album/80216363
- www.tidal.com/playlist/1c5d01ed-4f05-40c4-bd28-0f73099e9648
- www.tidal.com/track/64975224
- www.tidal.com/browse/album/80216363


<hr>

#### Credit: ❤️ A big thanks to [J0R6IT0#0001](https://github.com/J0R6IT0) to help me make urlRegex
