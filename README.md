# technical.scrolls.org

Prototyping atproto feed/label service

### "Test in production"

1. Make sure `FLY_DEV=1` and `PROD_PG_URL=xxx` is set in your .env
2. Run `fly proxy 5432 -a techscrolls-db3`
3. Run whatever package that uses our .env file

```
FLY_DEV=1 bun run xxx
```

### Goals

- [ ] Web service that listens for posts and allows me to add tags to posts. e.g. "#golang" "#tech" to train the classifiers
- [ ] Offers a feed to Bluesky powered by classifiers
  - [ ] Everything
  - [ ] Programming Languages (Go, Python, PHP, TypeScript, etc)
- [ ] Produce a feed of pure technical content via classifiers
- [ ] Label contributors to that feed with cute labels

### Prototype stage

- [x] Subscribe to the stream
- [x] Authenticate as bsky client
- [ ] Introduce self as feed
- [ ] Hard code a few posts as items

### Training the classifier

- Idea: Use likes on the account. We can browse some feeds and like what's tech. Then we need the negatives somehow
- Idea: Browser extension that talks to my service
  - Joker: Need to be able to authenticate the user with Bluesky

### Platform tasks

- [ ] Service login w. service id/pass
- [ ] Basic web-service w. routes
- [ ] Allow a user to login w. app password to train the service
- [ ] Persistance and hosting (only need that when we do a feed)

### Notes

- Jetstream server https://github.com/bluesky-social/jetstream/tree/main
- Sensible label starter https://github.com/aliceisjustplaying/labeler-starter-kit-bsky/blob/main/src/main.ts
- Leaner SDK https://github.com/mary-ext/atcute/tree/trunk/packages/core/client
- Skyware. Bunch of thin libraries https://github.com/skyware-js/bot
