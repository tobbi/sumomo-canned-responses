// May the tanglao be with you!!

// Import the page-mod API so that we 
// can do stuff once gsfn loaded:
var pageMod = require("page-mod");
var Request = require("request").Request;
var data = require("self").data;

const sumomoBase = "https://support.mozillamessaging.com";
const KBbase = sumomoBase + "/en-US/kb/";

// Create a page mod
pageMod.PageMod({
    include: ["*.getsatisfaction.com"],
    contentScriptFile: [data.url('jquery-1.7.2.min.js'),
                        data.url('kbox.js'),
                        data.url('gsfnCannedResponses.js')],
    contentScriptWhen: 'ready',
    contentStyleFile: [data.url("style/kbox.css"),
                       data.url("style/cannedresponses.css")],
    /**
     * Higher privileges here for the AJAX call! <3
     * Niveau is not a skin cream!!!
     */
    onAttach: function(worker) {
        /**
         * Loads a remote document and returns its HTML source
         */
        worker.port.on('load-remote-content-doc', function(article) {
            Request({
                url: KBbase + article,
                onComplete: function (response) {
                    worker.port.emit('canned-responses-loaded', response.text);
                }
            }).get();
        });
        
        /**
         * Loads a remote wiki document edit page and returns its HTML source
         */
        worker.on('message', function(message) {
            if(message.kind == 'load-remote-article-src') {
                Request({
                    url: sumomoBase + message.which + "/edit",
                    onComplete: function (response) {
                        worker.port.emit('response-content-loaded', response.text);
                    }
                }).get();
            }
        });
    }
});