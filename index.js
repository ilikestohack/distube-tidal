const Tidal = require("@dastormer/tidal-api-wrapper");
const tidal = new Tidal();
const { CustomPlugin, Song, Playlist } = require("distube");
const SITE_URL = "https:\/\/www.tidal.com\/";
const SUPPORTED_TYPES = ["album", "playlist", "track", "video", "artist", "mix"];
const urlRegex = /^(https?:\/\/)?(?:www\.)?tidal\.com\/(browse\/)?(track|video|artist|album|playlist|mix)\/(.*?)$/gm;

module.exports = class TidalPlugin extends CustomPlugin {
  constructor(options = {}) {
    super();
    this.parallel = typeof options.parallel === "boolean" ? options.parallel : true;
    this.emitPlaySongAfterFetching = !!options.emitPlaySongAfterFetching;
  }

  validate(url) {
    if (typeof url !== "string" || !url.includes("tidal") || !SUPPORTED_TYPES.some(typ => url.includes(typ))) return false;
    if (!urlRegex.test(url)) return false;
    return true;
  }

  async play(voiceChannel, url, { member, textChannel, skip, unshift }) {
    const DT = this.distube;
    let urlId = url.split("/");
    urlId = urlId[urlId.length - 1];

    if (url.includes("track") || url.includes("video")) {
      let data;
      if (url.includes("track")) {
        data = await tidal.getTrack(urlId);
      } else if (url.includes("video")) {
        data = await tidal.getVideo(urlId);
      }
      const query = `${data.title} ${data.artists.map(c => c.name).join(" ")}`;
      const result = await this.search(query);
      if (!result) throw new Error(`[TidalPlugin] Cannot find "${query}" on YouTube.`);
      let memberSend = member.member;
      await DT.play(voiceChannel, result, { memberSend, textChannel, skip });
    } else {
      let rawData;
      let tracksData;
      let type;
      if (url.includes("artist")) {
        rawData = await tidal.getArtist(urlId);
        const albums = await tidal.getArtistAlbums(urlId);
        const promises = albums.map(async (album) => await tidal.getAlbumTracks(album.id));
        tracksData = await Promise.all(promises);
        type = "artist";
      } else if (url.includes("album")) {
        rawData = await tidal.getAlbum(urlId);
        tracksData = await tidal.getAlbumTracks(urlId);
        type = "album";
      } else if (url.includes("playlist")) {
        rawData = await tidal.getPlaylist(urlId);
        tracksData = await tidal.getPlaylistTracks(urlId);
        type = "playlist";
      } else if (url.includes("mix")){
        rawData = await tidal.getMix(urlId);
        tracksData = await tidal.getMixTracks(urlId);
        type = "mix"
      }
      if (!rawData || !tracksData) throw new Error(`[TidalPlugin] Cannot find any data for "${url}" on Tidal.`);
      const playlist = resolvePlaylist(rawData, tracksData, type, member);
      let firstSong;
      while (!firstSong && playlist.songs.length) {
        const result = await this.search(playlist.songs.shift());
        if (!result) continue;
        firstSong = new Song(result, member)._patchPlaylist(playlist);
      }

      if (!firstSong && !playlist.songs.length) throw new Error(`[TidalPlugin] Cannot find any tracks of "${playlist.name}" on YouTube.`);
      let queue = DT.getQueue(voiceChannel);

      const fetchTheRest = async () => {
        if (playlist.songs.length) {
          if (this.parallel) {
            playlist.songs = await Promise.all(playlist.songs.map(query => this.search(query)));
          } else {
            for (const i in playlist.songs) {
              playlist.songs[i] = await this.search(playlist.songs[i]);
            }
          }
          playlist.songs = playlist.songs.filter(r => r)
            .map(r => new Song(r, member)._patchPlaylist(playlist));
          queue.addToQueue(playlist.songs, skip ? 1 : unshift ? 2 : -1);
        }
        playlist.songs.unshift(firstSong);
      };

      if (queue) {
        queue.addToQueue(firstSong, skip || unshift ? 1 : -1);
        if (skip) queue.skip();
        await fetchTheRest(unshift);
        if (!skip) DT.emit("addList", queue, playlist);
      } else {
        queue = await DT.queues.create(voiceChannel, firstSong, textChannel);
        if (queue === true) return;
        if (!this.emitPlaySongAfterFetching) DT.emit("playSong", queue, firstSong);
        await new Promise(resolve => {
          const check = setInterval(() => {
            if (Array.isArray(queue.songs) && queue.songs[0]?.streamURL) resolve(clearInterval(check));
          }, 500);
        });
        await fetchTheRest();
        if (this.emitPlaySongAfterFetching) DT.emit("playSong", queue, firstSong);
      }
    }
  }

  async search(query) {
    try {
      return (await this.distube.search(query, { limit: 1 }))[0];
    } catch { return null }
  }
};

const resolvePlaylist = (rawData, tracksData, type, member) => {
  const songs = tracksData.map(item => {
    const track = item;
    if (!track.url.includes("track")) return null;
    return `${track.title} ${track.artists.map(c => c.name).join(" ")}`;
  }).filter(Boolean);
  if (!songs.length) throw new Error(`[TidalPlugin] \`${rawData.title}\` does not contains any tracks.`);
  let thum;
  if (type === "artist") {
    thumb = tidal.artistPicToUrl(rawData.picture);
  } else if (type === "album") {
    thumb = tidal.albumArtToUrl(rawData.cover);
  } else if (type === "playlist") {
    thumb = tidal.albumArtToUrl(rawData.image);
  }else if(type === "mix"){
    thumb = tidal.getMixArt(rawData.uuid);
  }

  return new Playlist({
    name: rawData.title,
    thumbnail: thumb.xl || thumb.lg || thum.md || thum.sm || "",
    url: rawData.url || `${SITE_URL}${type}\/${rawData.id || rawData.uuid}` || "",
    songs
  }, member);
};
