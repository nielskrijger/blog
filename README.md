# README

This is my personal blog. The blog posts are written using Markdown, are hosted on Amazon S3 deployed using Gulp
for deployment needs and is composed entirely of static files.

## Deployment

Run the following command from the command line:

    gulp

This will build and deploy all statis assets to an S3 bucket.

## Development

To make changes and deploy those changes automatically to S3 run the following command:

    gulp watch

This will look at all assets, compile them and upload them to S3 automatically.
