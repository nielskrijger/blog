// Load page with list of blog posts
$(document).ready(loadContent);
$(window).on('hashchange', loadContent);

function loadContent() {
    var hash = window.location.hash.substring(1);
    if (!hash) {
        $.getJSON('data.json',
            function(data) {
                $('#body').html(MarkdownBlog.templates.posts(data));
            })
            .fail(function() {
                console.log('Failed to retrieve blog data');
            });
    } else {
        $('#body').load('/'+hash);
    }
}
