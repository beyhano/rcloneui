export namespace main {
	
	export class ScheduledTask {
	    id: number;
	    name: string;
	    enabled: boolean;
	    source: string;
	    dest: string;
	    mode: string;
	    cron_expr: string;
	    excludes: string;
	
	    static createFrom(source: any = {}) {
	        return new ScheduledTask(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.enabled = source["enabled"];
	        this.source = source["source"];
	        this.dest = source["dest"];
	        this.mode = source["mode"];
	        this.cron_expr = source["cron_expr"];
	        this.excludes = source["excludes"];
	    }
	}

}

