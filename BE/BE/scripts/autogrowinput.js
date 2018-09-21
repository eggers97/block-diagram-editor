(function ($) {     // http://stackoverflow.com/questions/931207/is-there-a-jquery-autogrow-plugin-for-text-fields

    $.fn.autoGrowInput = function (o) {

        o = $.extend({
            maxWidth: 1000,
            minWidth: 0,
            comfortZone: 70
        }, o);

        this./*filter('input:text').*/each(function () {    //  removed filter

            var minWidth = o.minWidth || $(this).width(),
                val = '',
                input = $(this),
                testSubject = $('<tester/>'),   // applying the css was moved to check() so it also works if the input's css changes through time
                check = function () {
                    testSubject.css({
                        position: 'absolute',
                        top: -9999,
                        left: -9999,
                        width: 'auto',
                        fontSize: input.css('fontSize'),
                        fontFamily: input.css('fontFamily'),
                        fontWeight: input.css('fontWeight'),
                        letterSpacing: input.css('letterSpacing'),
                        whiteSpace: 'nowrap'
                    });
                    testSubject.insertAfter(input);

                    val = input.val();

                    // Enter new content into testSubject
                    var escaped = val.replace(/&/g, '&amp;').replace(/\s/g, '&nbsp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    testSubject.html(escaped);

                    // Calculate new width + whether to change
                    var testerWidth = testSubject.width(),
                        newWidth = (testerWidth + o.comfortZone) >= minWidth ? testerWidth + o.comfortZone : minWidth,
                        currentWidth = input.width(),
                        isValidWidthChange = (newWidth < currentWidth && newWidth >= minWidth)
                                             || (newWidth > minWidth && newWidth < o.maxWidth);

                    // Animate width
                    if (isValidWidthChange) {
                        input.width(newWidth);
                    }
                    testSubject.remove();
                };

            //testSubject.insertAfter(input);               // creation of tester moved to check() so that it can be deleted after use -> no pollution
            
            $(this).bind('keyup keydown blur update change', check);    // added change because to make the onchange-handler get called "change" has to be fired
            input.width(o.minWidth);  // adjustment to have the right width from the beginning
            check();
        });

        return this;

    };

})(jQuery);