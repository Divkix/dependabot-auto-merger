# dependabot-auto-merger

> A GitHub App built with [Probot](https://github.com/probot/probot) that Bot to merge dependabot PR's based on a simple config file.

This bot is hosted on vercel!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdivideprojects%2Fdependabot-auto-merger)

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start

# Run the dev version of bot
npm run dev
```

## Docker

```sh
# 1. Build container
docker build -t dependabot-auto-merger .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> dependabot-auto-merger
```

## Config file

The bot works even without a config file but creating one will help ypu customise the beviour of bot.

Make a 'dependabot-auto-merger.yml' file in your `.github` folder of repository for more customised options.

```yaml
version: 1
auto-merge-settings:
    merge_level: "minor"
    merge_strategy: "squash"
    skip_ci: false
    delete_branch: true
```


## Contributing

If you have suggestions for how dependabot-auto-merger could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2022 Divide Projects


[![Sponsor](https://www.datocms-assets.com/31049/1618983297-powered-by-vercel.svg)](https://vercel.com/?utm_source=divideprojects&utm_campaign=oss)

