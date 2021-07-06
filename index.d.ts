export = TidalPlugin;
declare class TidalPlugin extends DisTube.CustomPlugin {
    constructor(options?: {});
    parallel: any;
    emitPlaySongAfterFetching: boolean;
    search(query: any): Promise<DisTube.SearchResult>;
}
import DisTube = require("distube");
