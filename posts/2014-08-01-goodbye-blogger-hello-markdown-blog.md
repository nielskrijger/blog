# Goodbye Blogger, Hello Markdown Blog

I have been looking for a new blogging solution for some time. While [Blogger](http://www.blogger.com) has served my needs for a long time, I was dissatisfied with it for several reasons:

* Too slow.
* Only a very limited set of minimalist (and free) themes.
* Modifying themes is cumbersome.
* No native markdown support.
* Lots of features I don't need.

First I created a new blog using [WordPress](http://wordpress.com/) but there too I was overwhelmed by the sheer amount of features. In addition some of the features they offer you need to pay for, so I looked further.

## Markdown

I write most of my documentation in [Markdown](http://daringfireball.net/projects/markdown/syntax) and decided I wanted to write my blog posts in Markdown as well. And hurray, such a blogging system exists: [Jekyll](http://jekyllrb.com/); but after 20 minutes with Jekyll I was dissapointed yet again. The sheer volume of Jekyll's [documentation](http://jekyllrb.com/docs/home/) and seeing how complex some of the [example](https://github.com/edhedges/edhedges.github.com/tree/dev) [source](https://github.com/dueyfinster/dueyfinster-old.github.io) [code](https://github.com/github/training.github.com/tree/7049d7532a6856411e34046aedfce43a4afaf424) [repositories](https://github.com/rsms/rsms.github.com) have become, I gave up quickly. Agreed, you can create simple websites with Jekyll but all I wanted was a simple markdown blog in a [Bootstrap](http://getbootstrap.com/) theme. How hard can it be?

Well, not hard at all.

Stubbornly I rolled my own solution in a couple of hours, hosted on [S3](http://aws.amazon.com/s3/), deployed with [Gulp](http://gulpjs.com/), and composed entirely from static files.

You can find the source code of this blog [here](https://github.com/nielskrijger/blog).
