// gsfnCannedResponses.js - tobbi (2)'s module
// author: tobbi

var d = document; 
var w = window;
var location = d.location.href;

var gsfnCannedResponses = function() {
    if(this.isForumPage) {
        this.addButton();
    }
};
gsfnCannedResponses.prototype = {
    /**
     * Returns true if the currently loaded
     * page is a mozilla messaging forum thread
     */
    get isForumPage() {
        return (location.indexOf('mozilla_messaging/topics') > -1 &&
                this.replyContent.length > 0);
    },
    
    /**
     * Returns the reply text area
     */
    get replyContent() {
        // Why, oh why, do you make me do this, gsfn!
        return $('#topic_reply_box #reply_content');
    },
    
    /**
     * The location of the canned responses listing article
     */
    get responsesArticle() {
        return 'canned-responses';
    },
    
    /**
     * Adds a button to the thread and returns it
     */ 
    addButton: function() {
        var self = this;
        var button = $('<a></a>')
        .attr("class", "button btn-cannedresponses")
        .text('Canned responses')
        .click(function() {
            self.openCannedResponses(self);
        })
        .insertBefore(this.replyContent);
        return button;
    },
    
    /**
     * Opens the canned responses window
     * FIXME (maybe?): No privilege control ('permission markers') yet
     * @param self Reference to the 'this' object
     */
    openCannedResponses: function(self) {
        //Display the canned responses window:
        var $html = self.$html = $(
            '<section class="marky">' +
            '<div class="search">' +
            '<label for="filter-responses-field">Search: </label>' +
            '<input type="text" name="q" id="filter-responses-field"' +
            'placeholder="Search for common responses" />' +
            '</div></div>' +
            '<div class="area" id="responses-area">' +
            '<h2 class="heading-label">Categories</h2>' +
            '<ul class="category-list">' +
            '<li class="status-indicator busy">Loading...</li>' +
            '</ul></div>' +
            '<div class="area" id="response-list-area">' +
            '<h2 class="heading-label">Responses</h2>' +
            '<span class="nocat-label">Please select a category from the previous column or start a search.</span>' +
            '<p class="response-list"/>' +
            '</div>' +
            '<div class="area" id="response-content-area">' +
            '<h2 class="heading-label preview-label">Response editor</h2>' +
            '<a class="toggle-view button" href="#">Preview</a>' +
            '<p class="response-preview">' +
            '<textarea id="response-content">' +
            '</textarea></p>' +
            '<p class="response-preview-rendered"></p>' +
            '</div>' +
            '</div>' +
            '<div class="placeholder" /><div id="response-submit-area">' +
            '<a class="button" id="insert-response">Insert Response</button>' +
            '<a class="button kbox-cancel" href="#cancel">Cancel</a>' +
            '</div>' +
            '</section>'
        ),
        kbox,
        currentReplyBox = self.replyContent;

        kbox = new KBox($html, {
            title: 'Insert a canned response...',
            destroy: true,
            modal: true,
            id: 'media-modal',
            container: $('body'),
        });
        
        // Get the canned responses first:
        self.getResponses();
        
        // Register some event handlers:
        // Insert response button:
        $('#insert-response', $html).click(function() {
            let responseVal = $('#response-content').val().trim();
            if(responseVal != '') {
                currentReplyBox.val(currentReplyBox.val() + responseVal);
                kbox.close();
            }
        });
        
        $('#filter-responses-field', $html).keyup(function() {
            var term = $(this).val();
            self.searchResponses(term, $html);
        });
        
        // Toggle button:
        $('.toggle-view', $html).toggle(function() {
            $(this).text('Source');
            $('.preview-label').text('Response preview');
            self.HTMLPreview($('#response-content', $html).val());
            $('.response-preview', $html).css("display", "none");
            $('.response-preview-rendered', $html).css("display", "block");
        }, function() {
            $(this).text('Preview');
            $('.preview-label', $html).text('Response editor');
            $('.response-preview', $html).css("display", "block");
            $('.response-preview-rendered', $html).css("display", "none");
        });

        // Open the Kbox
        kbox.open();
    },
    
    /**
     * Start the AJAX call for getting the canned responses from SUMOMO
     */
     getResponses: function() {
        self.port.emit('load-remote-content-doc', this.responsesArticle);
     },
     
     /**
      * Gets loaded once the AJAX call is successfully completed
      * @param page_source: the page source of the loaded document
      */
     onCannedResponsesLoaded: function(page_source) {
        var $categoryList = $('.category-list'),
            $responsesList = $('.response-list'),
            //$categories = $(page_source).find('[id^=w_]');
            $categories = $('[id^=w_]', page_source),
            $html = CR.$html;

            $categoryList.empty();
            $responsesList.empty();

            $categories.each(function(el, i) {
                var label = $(this).text(),
                    $headingItem = $(document.createElement('li')),
                    $responses = $(document.createElement('ul')).hide(),
                    $catResponses = $(this).nextUntil('[id^=w_]').find('a'),
                    $noCatLabel = $html.find('.nocat-label'),
                    $otherResponses,
                    $otherHeadings;

                $catResponses.each(function(el, i) {
                    var $response = $(document.createElement('li')).addClass('response'),
                        $response_link = $(document.createElement('a')).text($(this).text()),
                        response_target = $(this).attr('href'),
                        response_target = response_target.split('#')[0];
                        $response.click(function() {
                            $('.response-list li').not($(this)).removeClass('selected');
                            $(this).addClass('selected');

                            // We're busy!
                            $('.preview-label').addClass("busy");

                            // Start fetching the article source:
                            self.postMessage({
                                kind: "load-remote-article-src",
                                which: response_target
                            });
                        });

                        $response.append($response_link);
                        $responses.append($response);
                });

                $headingItem.addClass('response-heading').text(label)
                    .click(function() {
                        $noCatLabel.hide();
                        $otherResponses = $responsesList.find('ul').not($responses);
                        $otherResponses.hide();
                        
                        $otherHeadings = $categoryList.find('.response-heading')
                                                      .not($headingItem);
                        $otherHeadings.removeClass('selected');
                    
                        $(this).addClass('selected');
                        $responses.show();
                });
                    
                $categoryList.append($headingItem);
                $responsesList.append($responses);
            });
     },
     /**
      * Gets executed once the source for a specific response (wiki article)
      * has loaded.
      * @param article_src: The page source of the loaded wiki article
      */
     onResponseContentLoaded: function(article_src) {
        var responseTextContent = $('#id_content', article_src).val();
        $('.preview-label').removeClass("busy");
        if(responseTextContent != undefined)
            $('#response-content').val(responseTextContent);
        else
            alert("Canned responses for Thunderbird support was unable to get " +
                  "the content of this response.\r\n\r\nMake sure that you are" +
                  " currently logged in to support.mozillamessaging.com\r\nand" +
                  " try again!");
     },
     
     /**
      * Searches through the list of responses
      * @param term: The search term to look for
      * @param $html: The HTML snippet of the widget
      */
     searchResponses: function(term, $html) {
        var term = term.toLowerCase().trim();
        var $searchHeading = $html.find('#response-list-area .heading-label');
        var $noCategorySelected = $html.find('.nocat-label');
        var $responseLists = $html.find('.response-list ul');
        var $responses = $html.find('.response');
        var $responseListArea = $html.find('#response-list-area');
        var $responsesArea = $html.find('#responses-area');
        
        if(term === '') {
            $searchHeading.text('Responses');
            $responseListArea.removeClass('filtered');
            $responsesArea.removeClass('filtered');
            $noCategorySelected.show();
            $responses.show();
            $responseLists.hide();
            return;
        }
        
        $responseListArea.addClass('filtered');
        $responsesArea.addClass('filtered');
        $searchHeading.text('Matching responses');
        $noCategorySelected.hide();
        $responseLists.show();

        $responses.each(function() {
            var text = $(this).text().toLowerCase();
            if(text.indexOf(term) === -1) {
                $(this).hide();
            }
            else {
                $(this).show();
            }
        });
    },
    
    /**
     * Returns an HTML preview of the text
     * @param text_content: The HTML source
     */
    HTMLPreview: function(text_content) {
        $('.response-preview-rendered').html(text_content);
    }
};

// Create a new instance of the canned responses object
var CR = new gsfnCannedResponses();

// Handle messages from the AJAX call correctly:
self.port.on("canned-responses-loaded", CR.onCannedResponsesLoaded);
self.port.on("response-content-loaded", CR.onResponseContentLoaded);