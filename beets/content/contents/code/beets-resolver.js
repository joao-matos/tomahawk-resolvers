// Map all the audio types supported by beets to extensions and MIME types.
var AUDIO_TYPES = {
    'MP3':      ['mp3',  'audio/mpeg'],
    'AAC':      ['m4a',  'audio/mp4'],
    'OGG':      ['ogg',  'audio/ogg'],
    'FLAC':     ['flac', 'audio/x-flac'],
    'APE':      ['ape',  'audio/ape'],
    'WavPack':  ['wv',   'audio/x-wavpack'],
    'MusePack': ['mpc',  'audio/x-musepack']
};

var BeetsResolver = Tomahawk.extend(TomahawkResolver, {
    settings: {
        name: 'beets',
        icon: 'beets-icon.png',
        weight: 95,
        timeout: 5
    },

    // Resolution.
    resolve: function (qid, artist, album, title) {
        this.beetsQuery(qid, ['artist:' + artist, 'album:' + album, 'title:' + title]);
    },

    search: function (qid, searchString) {
        this.beetsQuery(qid, searchString.split(' '));
    },

    baseUrl: function () {
        return 'http://' + this.host + ':' + this.port;
    },

    beetsQuery: function (qid, queryParts) {
        var baseUrl = this.baseUrl(),
            url = this.baseUrl() + '/item/query/';
        queryParts.forEach(function (item) {
            url += encodeURIComponent(item);
            url += '/';
        });
        url = url.substring(0, url.length - 1);  // Remove last /.

        Tomahawk.asyncRequest(url, function (xhr) {
            var resp = JSON.parse(xhr.responseText),
                items = resp.results,
                searchResults = [];
            items.forEach(function (item) {
                var type_info = AUDIO_TYPES[item.format];
                searchResults.push({
                    artist: item.artist,
                    album: item.album,
                    track: item.title,
                    albumpos: item.track,
                    source: "beets",
                    url: baseUrl + '/item/' + item.id + '/file',
                    bitrate: Math.floor(item.bitrate / 1024),
                    duration: Math.floor(item.length),
                    size: (item.size || 0),
                    score: 1.0,
                    extension: type_info[0],
                    mimetype: type_info[1],
                    year: item.year
                });
            });
            Tomahawk.addTrackResults({
                qid: qid,
                results: searchResults
            });
        });
    },

    // Configuration.
    getConfigUi: function () {
        var uiData = Tomahawk.readBase64("config.ui");
        return {
            "widget": uiData,
            "fields": [{
                name: "host",
                widget: "hostField",
                property: "text"
            }, {
                name: "port",
                widget: "portField",
                property: "text"
            }]
        };
    },
    newConfigSaved: function () {
        this.init();
    },
    init: function () {
        var userConfig = this.getUserConfig();
        this.host = userConfig.host || 'localhost';
        this.port = parseInt(userConfig.port, 10);
        if (isNaN(this.port) || !this.port) {
            this.port = 8337;
        }
    },
});

Tomahawk.resolver.instance = BeetsResolver;
